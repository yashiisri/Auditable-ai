import pandas as pd
import json
from fastapi import UploadFile


def parse_file(file: UploadFile):
    filename = file.filename.lower()

    if filename.endswith(".csv"):
        df = pd.read_csv(file.file)
    elif filename.endswith(".json"):
        content = json.load(file.file)
        if isinstance(content, list):
            df = pd.DataFrame(content)
        else:
            df = pd.json_normalize(content)
    else:
        raise ValueError("Unsupported file format. Only CSV and JSON allowed.")

    df.columns = [c.strip().lower() for c in df.columns]
    return df