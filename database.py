# database.py (refatorado)
import json
import os


def salvar_dados(nome_arquivo, dados):
    try:
        with open(nome_arquivo, 'w', encoding='utf-8') as f:
            json.dump(dados, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erro ao salvar {nome_arquivo}: {e}")
        return False


def carregar_dados(nome_arquivo):
    try:
        if not os.path.exists(nome_arquivo):
            return []
        with open(nome_arquivo, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Erro de formato JSON em {nome_arquivo}.")
        return []
    except Exception as e:
        print(f"Erro ao carregar {nome_arquivo}: {e}")
        return []


def carregar_config():
    caminho = 'config.json'
    try:
        if not os.path.exists(caminho):
            return {}
        with open(caminho, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao carregar configuração: {e}")
        return {}
