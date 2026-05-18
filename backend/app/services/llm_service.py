import httpx
from sqlalchemy.orm import Session
from ..database import LLMConfig

class LLMService:
    def __init__(self, db: Session):
        # 获取当前激活的配置
        self.config = db.query(LLMConfig).filter(LLMConfig.is_active == True).first()
        if not self.config:
            # 如果没有激活的，尝试获取第一个
            self.config = db.query(LLMConfig).first()
            if not self.config:
                raise ValueError("LLM 配置未找到，请先在设置中配置")
            
        # 去除可能存在的首尾空格
        self.api_key = self.config.api_key.strip() if self.config.api_key else ""
        self.model_name = self.config.model_name.strip() if self.config.model_name else ""
        self.provider = self.config.provider
        
        # 设置 base_url
        if self.config.base_url and self.config.base_url.strip():
            self.base_url = self.config.base_url.strip()
        else:
            if self.provider == "openai":
                self.base_url = "https://api.openai.com/v1"
            elif self.provider == "deepseek":
                self.base_url = "https://api.deepseek.com"
            else:
                self.base_url = "https://api.openai.com/v1" # 默认

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            return "错误：未配置 API Key，请前往设置页面配置。"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "stream": False
        }
        
        try:
            # 确保 url 拼接正确
            url = f"{self.base_url.rstrip('/')}/chat/completions"
            if not url.endswith("/v1/chat/completions") and self.provider == "openai":
                 url = f"{self.base_url.rstrip('/')}/v1/chat/completions"
                 
            print(f"正在请求 LLM API: {url}")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    headers=headers,
                    json=payload
                )
                
                # 如果是 401 错误，提供更友好的提示
                if response.status_code == 401:
                    key_len = len(self.api_key)
                    key_preview = f"{self.api_key[:4]}...{self.api_key[-4:]}" if key_len > 8 else "太短"
                    return f"AI 请求失败 (401 未授权)。\n\n诊断信息：\n- 请求地址: {url}\n- 模型名称: {self.model_name}\n- Key长度: {key_len} 字符\n- Key预览: {key_preview}\n\n可能原因：\n1. API Key 填写错误（请核对预览是否与您的一致）\n2. DeepSeek 账号余额不足（DeepSeek 需要充值后才能调用 API）\n3. API Key 已被平台封禁或停用"
                    
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            print(f"LLM HTTP 错误: {e.response.text}")
            return f"AI 请求失败: HTTP {e.response.status_code} - {e.response.text}"
        except Exception as e:
            print(f"LLM 调用失败: {e}")
            return f"AI 请求失败: {str(e)}"
