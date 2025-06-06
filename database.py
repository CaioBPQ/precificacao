# database.py
import json

def salvar_dados(nome_arquivo, dados):
    """Salva os dados em um arquivo JSON."""
    try:
        with open(nome_arquivo, 'w', encoding='utf-8') as f:
            json.dump(dados, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erro ao salvar dados em {nome_arquivo}: {e}")
        return False

def carregar_dados(nome_arquivo):
    """Carrega os dados de um arquivo JSON. Retorna uma lista vazia se o arquivo não existir."""
    try:
        with open(nome_arquivo, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return [] # Retorna lista vazia para materiais e produtos
    except json.JSONDecodeError:
        return [] # Retorna lista vazia se o arquivo estiver corrompido
    except Exception as e:
        print(f"Erro ao carregar dados de {nome_arquivo}: {e}")
        return []

def carregar_config():
    """Função específica para carregar a configuração."""
    try:
        with open('config.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {} # Retorna dicionário vazio se não houver config
    except Exception as e:
        print(f"Erro ao carregar config.json: {e}")
        return {}