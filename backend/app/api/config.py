from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db, LLMConfig
from ..schemas import LLMConfigCreate, LLMConfigUpdate

router = APIRouter()

@router.get("/config/llm")
def get_llm_configs(db: Session = Depends(get_db)):
    """获取所有大模型配置"""
    configs = db.query(LLMConfig).all()
    return configs

@router.post("/config/llm")
def create_llm_config(config_in: LLMConfigCreate, db: Session = Depends(get_db)):
    """新增大模型配置"""
    count = db.query(LLMConfig).count()
    is_active = count == 0 # 如果是第一个，默认激活
    
    new_config = LLMConfig(
        provider=config_in.provider,
        api_key=config_in.api_key,
        base_url=config_in.base_url,
        model_name=config_in.model_name,
        is_active=is_active
    )
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config

@router.put("/config/llm/{config_id}")
def update_llm_config(config_id: int, config_in: LLMConfigUpdate, db: Session = Depends(get_db)):
    """更新大模型配置"""
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
        
    if config_in.provider is not None: config.provider = config_in.provider
    if config_in.api_key is not None: config.api_key = config_in.api_key
    if config_in.base_url is not None: config.base_url = config_in.base_url
    if config_in.model_name is not None: config.model_name = config_in.model_name
    
    db.commit()
    db.refresh(config)
    return config

@router.delete("/config/llm/{config_id}")
def delete_llm_config(config_id: int, db: Session = Depends(get_db)):
    """删除大模型配置"""
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    
    was_active = config.is_active
    db.delete(config)
    db.commit()
    
    # 如果删除的是激活的，随机激活另一个
    if was_active:
        first_config = db.query(LLMConfig).first()
        if first_config:
            first_config.is_active = True
            db.commit()
            
    return {"message": "删除成功"}

@router.put("/config/llm/{config_id}/active")
def set_active_llm_config(config_id: int, db: Session = Depends(get_db)):
    """设置激活的大模型配置"""
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
        
    # 将所有配置设为非激活
    db.query(LLMConfig).update({LLMConfig.is_active: False})
    # 将当前配置设为激活
    config.is_active = True
    db.commit()
    return {"message": "设置成功"}
