#!/usr/bin/env python3
import os
import json, datetime
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.environ["TOGETHER_API_KEY"],
    base_url="https://api.together.xyz/v1"
)

data_file = Path("data/prompts.json")
output_root = Path("generated")

prompts = json.loads(data_file.read_text())

for p in prompts:
    print(f"🌀 Generating {p['id']} ...")
    result = client.chat.completions.create(
        model=p.get("model", "gpt-5"),
        temperature=p.get("temperature", 0.8),
        messages=[{"role": "user", "content": p["prompt"]}]
    )
    text = result.choices[0].message.content.strip()
    out = output_root / p["target"]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(f"---\n# generated {datetime.date.today()}\n---\n{text}\n", encoding="utf-8")
    print(f"✅  Wrote {out}")
