from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json

from ..database import get_db, Book, Chapter, AIAnalysisCache, AIChatHistory
from ..schemas import AICompanionRequest, AIChatHistoryResponse
from typing import List
from ..services.llm_service import LLMService
from ..services.parser.parser_factory import ParserFactory
from ..prompts.ai_companion import EXPLAIN_PROMPT, TRANSLATE_PROMPT, BACKGROUND_PROMPT, EXTEND_PROMPT, CHAT_PROMPT
from ..prompts.semantic_analysis import SEMANTIC_ANALYSIS_SYSTEM_PROMPT, SEMANTIC_ANALYSIS_USER_PROMPT, SEMANTIC_MARK_SYSTEM_PROMPT, SEMANTIC_MARK_USER_PROMPT
from ..schemas import SemanticMarkRequest

router = APIRouter()

@router.get("/book/{book_id}/analyze")
async def analyze_chapter(book_id: int, chapter_index: int = 0, force_analyze: bool = False, db: Session = Depends(get_db)):
    """调用 LLM 进行语义层阅读分析"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")

    # 1. 获取章节内容
    chapter_content = ""
    chapter_title = f"第 {chapter_index + 1} 部分"
    
    if book.file_type in ["txt", "epub", "docx"]:
        chapter = db.query(Chapter).filter(Chapter.book_id == book_id, Chapter.chapter_index == chapter_index).first()
        if chapter:
            chapter_title = chapter.title
            try:
                elements = json.loads(chapter.content)
                chapter_content = "\n".join([el.get("content", "") for el in elements if el.get("type") == "text"])
            except:
                chapter_content = chapter.content
    elif book.file_type == "pdf":
        try:
            parser = ParserFactory.get_parser(book.file_path)
            elements = parser.parse_page(chapter_index)
            parser.close()
            chapter_content = "\n".join([el.get("content", "") for el in elements if el.get("type") == "text"])
        except Exception as e:
            print(f"PDF 读取失败: {e}")
            
    if not chapter_content.strip():
        raise HTTPException(status_code=400, detail="章节内容为空，无法分析")

    # 2. 检查缓存
    cached_analysis = db.query(AIAnalysisCache).filter(
        AIAnalysisCache.book_id == book_id,
        AIAnalysisCache.chapter_index == chapter_index
    ).first()

    if cached_analysis:
        try:
            return json.loads(cached_analysis.analysis_result)
        except json.JSONDecodeError:
            # 如果缓存数据损坏，删除它并重新生成
            db.delete(cached_analysis)
            db.commit()
            
    # 如果没有缓存且不强制分析，则直接返回特定状态
    if not force_analyze:
        return {"status": "no_cache"}

    # 3. 截取适量文本进行分析 (避免 token 超出限制)
    # 实际应用中可能需要更智能的 chunking 策略
    text_to_analyze = chapter_content[:3000] 

    # 4. 调用 LLM
    try:
        llm_service = LLMService(db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user_prompt = SEMANTIC_ANALYSIS_USER_PROMPT.format(
        book_title=book.title,
        chapter_title=chapter_title,
        text_content=text_to_analyze
    )

    try:
        # 强制要求 JSON 输出
        response_text = await llm_service.generate_response(
            SEMANTIC_ANALYSIS_SYSTEM_PROMPT, 
            user_prompt
        )
        
        # 检查是否是 LLMService 返回的错误信息
        if response_text.startswith("AI 请求失败") or response_text.startswith("错误："):
            raise HTTPException(status_code=500, detail=response_text)
            
        # 4. 解析 JSON 结果
        # 尝试清理可能存在的 markdown 代码块标记
        cleaned_text = response_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[3:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        analysis_result = json.loads(cleaned_text.strip())
        
        # 补充一些前端需要的默认字段 (如 relatedNotes)
        if "relatedNotes" not in analysis_result:
            analysis_result["relatedNotes"] = []
            
        # 兼容前端 API 文档中的 characterRelations 字段名
        if "relations" in analysis_result and "characterRelations" not in analysis_result:
            analysis_result["characterRelations"] = analysis_result.pop("relations")
            
        # 5. 保存到缓存
        new_cache = AIAnalysisCache(
            book_id=book_id,
            chapter_index=chapter_index,
            analysis_result=json.dumps(analysis_result, ensure_ascii=False)
        )
        db.add(new_cache)
        db.commit()
            
        return analysis_result
        
    except json.JSONDecodeError as e:
        print(f"JSON 解析失败: {e}\nLLM 返回内容: {response_text}")
        raise HTTPException(status_code=500, detail="AI 返回的数据格式不正确，请重试")
    except Exception as e:
        print(f"AI 分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"AI 分析失败: {str(e)}")

@router.post("/ai/companion")
async def ai_companion(request: AICompanionRequest, db: Session = Depends(get_db)):
    """AI 伴读功能接口"""
    try:
        llm_service = LLMService(db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    system_prompt = ""
    user_prompt = ""

    if request.action == "explain":
        system_prompt = "你是一个专业的阅读助手。"
        user_prompt = EXPLAIN_PROMPT.format(selected_text=request.selected_text, context=request.context)
    elif request.action == "translate":
        system_prompt = "你是一个精通多国语言的翻译专家。"
        user_prompt = TRANSLATE_PROMPT.format(selected_text=request.selected_text, context=request.context)
    elif request.action == "background":
        system_prompt = "你是一个渊博的历史和文化学者。"
        user_prompt = BACKGROUND_PROMPT.format(selected_text=request.selected_text, context=request.context)
    elif request.action == "extend":
        system_prompt = "你是一个富有洞察力的思想家。"
        user_prompt = EXTEND_PROMPT.format(selected_text=request.selected_text, context=request.context)
    elif request.action == "chat":
        system_prompt = "你是一个智能阅读伴侣。"
        user_prompt = CHAT_PROMPT.format(context=request.context, user_message=request.user_message)
    else:
        raise HTTPException(status_code=400, detail="不支持的 action")

    # 如果不是 chat 模式，但用户输入了附加信息，则追加到 prompt 中
    if request.action != "chat" and request.user_message.strip():
        user_prompt += f"\n\n用户的附加要求/问题：{request.user_message}"

    response_text = await llm_service.generate_response(system_prompt, user_prompt)
    
    # 保存到历史记录
    history = AIChatHistory(
        book_id=request.book_id,
        chapter_index=request.chapter_index,
        action=request.action,
        selected_text=request.selected_text,
        user_message=request.user_message,
        ai_response=response_text
    )
    db.add(history)
    db.commit()
    
    return {"result": response_text}

@router.post("/ai/semantic_mark")
async def semantic_mark(request: SemanticMarkRequest, db: Session = Depends(get_db)):
    """对选中文本进行语义标记"""
    try:
        llm_service = LLMService(db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user_prompt = SEMANTIC_MARK_USER_PROMPT.format(
        context=request.context,
        selected_text=request.selected_text
    )

    try:
        response_text = await llm_service.generate_response(
            SEMANTIC_MARK_SYSTEM_PROMPT, 
            user_prompt
        )
        
        # 检查是否是 LLMService 返回的错误信息
        if response_text.startswith("AI 请求失败") or response_text.startswith("错误："):
            raise HTTPException(status_code=500, detail=response_text)
            
        # 解析 JSON 结果
        cleaned_text = response_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[3:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        mark_result = json.loads(cleaned_text.strip())
        
        # 更新缓存
        cached_analysis = db.query(AIAnalysisCache).filter(
            AIAnalysisCache.book_id == request.book_id,
            AIAnalysisCache.chapter_index == request.chapter_index
        ).first()
        
        if cached_analysis:
            analysis_data = json.loads(cached_analysis.analysis_result)
        else:
            analysis_data = {}
            
        if "semanticMarkers" not in analysis_data:
            analysis_data["semanticMarkers"] = []
            
        new_markers = []
        # 为选中的每个段落都生成一个 marker
        for p_idx in request.paragraph_indices:
            new_marker = {
                "text": request.selected_text,
                "type": mark_result.get("type", "core"),
                "tag": mark_result.get("tag", "核心论点"),
                "explanation": mark_result.get("explanation", ""),
                "paragraphIndex": p_idx
            }
            new_markers.append(new_marker)
            
            # 检查是否已经存在该段落的标记，如果存在则替换，否则追加
            existing_idx = next((i for i, m in enumerate(analysis_data["semanticMarkers"]) if m.get("paragraphIndex") == p_idx), -1)
            if existing_idx >= 0:
                analysis_data["semanticMarkers"][existing_idx] = new_marker
            else:
                analysis_data["semanticMarkers"].append(new_marker)
            
        if cached_analysis:
            cached_analysis.analysis_result = json.dumps(analysis_data, ensure_ascii=False)
        else:
            new_cache = AIAnalysisCache(
                book_id=request.book_id,
                chapter_index=request.chapter_index,
                analysis_result=json.dumps(analysis_data, ensure_ascii=False)
            )
            db.add(new_cache)
            
        db.commit()
            
        return new_markers
        
    except json.JSONDecodeError as e:
        print(f"JSON 解析失败: {e}\nLLM 返回内容: {response_text}")
        raise HTTPException(status_code=500, detail="AI 返回的数据格式不正确，请重试")
    except Exception as e:
        print(f"AI 标记失败: {e}")
        raise HTTPException(status_code=500, detail=f"AI 标记失败: {str(e)}")

@router.get("/ai_history/all", response_model=List[AIChatHistoryResponse])
def get_all_ai_history(db: Session = Depends(get_db)):
    """获取所有 AI 问答历史"""
    return db.query(AIChatHistory).order_by(AIChatHistory.created_at.desc()).all()

@router.get("/book/{book_id}/ai_history", response_model=List[AIChatHistoryResponse])
def get_ai_history(book_id: int, chapter_index: int = None, db: Session = Depends(get_db)):
    """获取某本书的 AI 问答历史，可按章节过滤"""
    query = db.query(AIChatHistory).filter(AIChatHistory.book_id == book_id)
    if chapter_index is not None:
        query = query.filter(AIChatHistory.chapter_index == chapter_index)
    return query.order_by(AIChatHistory.created_at.desc()).all()

@router.delete("/ai_history/{history_id}")
def delete_ai_history(history_id: int, db: Session = Depends(get_db)):
    """删除单条 AI 问答历史"""
    history = db.query(AIChatHistory).filter(AIChatHistory.id == history_id).first()
    if not history:
        raise HTTPException(status_code=404, detail="历史记录不存在")
        
    db.delete(history)
    db.commit()
    return {"message": "删除成功"}
