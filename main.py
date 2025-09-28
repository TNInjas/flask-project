import requests
import json
from API import DEEPSEEK_R1_API, DEEPSEEK_V3_API, MISTRAL_LARGE_LATEST
from Prompts.Project_prompt import Project_prompt
from Prompts.Question_practice_prompt import Question_practice_prompt
from Prompts.Concept_revision_prompt import Concept_revision_prompt

class Model_communication:
    def __init__(self):
        self.api_keys = {
            "Deepseek_R1": DEEPSEEK_R1_API.DeepSeek_R1_API,
            "Deepseek_V3.1": DEEPSEEK_V3_API.Deepseek_V3_API,
            "Mistral_large_latest": MISTRAL_LARGE_LATEST.Mistral_large_latest_API
        }
        self.urls = {
            "Deepseek_R1": "https://openrouter.ai/api/v1/chat/completions",
            "Deepseek_V3.1": "https://openrouter.ai/api/v1/chat/completions",
            "Mistral_large_latest": "https://api.mistral.ai/v1/chat/completions"
        }
        self.model_map = {
            "Deepseek_R1": "deepseek/deepseek-r1:free",
            "Deepseek_V3.1": "deepseek/deepseek-chat-v3.1:free",
            "Mistral_large_latest": "mistral-large-latest"
        }
        self.prompts = {
            "Project_prompt": Project_prompt,
            "Question_practice_prompt": Question_practice_prompt,
            "Concept_revision_prompt": Concept_revision_prompt
        }

    def call_model(self, model_name, prompt=None, messages=None, **kwargs):
        url = self.urls.get(model_name)
        api_key = self.api_keys.get(model_name)
        model_id = self.model_map.get(model_name)
        if not url:
            return {"error": f"Model URL not configured for {model_name}. Please check your environment."}
        if not api_key:
            return {"error": f"API key not configured for {model_name}. Please check your environment."}
        if not model_id:
            return {"error": f"Model ID not configured for {model_name}. Please check your environment."}
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if messages:
            payload = {
                "model": model_id,
                "messages": messages,
                "max_tokens": 16000,
                "temperature": 0.7,
            }
        else:
            payload = {
                "model": model_id,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 16000,
                "temperature": 0.7,
            }
        try:
            response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=20)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            return {"error": "Model API timed out. Please try again later or check your network connection."}
        except requests.exceptions.ConnectionError:
            return {"error": "Could not connect to the model API. Please check your network or API URL."}
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "details": getattr(e.response, 'text', str(e))}