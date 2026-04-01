
import os
from dotenv import load_dotenv

load_dotenv()

def main():
    print("Hello from backend!")



GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if __name__ == "__main__":
    main()
