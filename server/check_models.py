import os
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Load your key
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("Error: No API Key found!")
else:
    # 2. Configure Google
    genai.configure(api_key=api_key)

    print(f"Checking models for key: {api_key[:5]}... \n")
    
    # 3. List everything available to YOU
    try:
        for m in genai.list_models():
            # We only want models that can 'generateContent' (Chat models)
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
                
    except Exception as e:
        print(f"Error connecting to Google: {e}")