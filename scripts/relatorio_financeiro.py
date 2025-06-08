"""
Gerador de Relatórios Financeiros Avançados
"""

import json
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from typing import Dict, List
import numpy as np

class RelatorioFinanceiro:
    def __init__(self):
        self.dados_orcamentos = []
    
    def carregar_dados(self, dados_json: str):
        """Carrega dados dos orçamentos"""
        try:
            self.dados_orcamentos = json.loads(dados_json)
            print(f"Carregados {len(self.dados_orcamentos)} orçamentos")
        except json.JSONDecodeError:
            print("Erro ao carregar dados JSON")
    
    def gerar_relatorio_mensal(self, ano: int, mes: int) -> Dict:
        """Gera relatório financeiro mensal"""
        orcamentos_mes = [
            o for o in self.dados_orcamentos 
            if datetime.fromisoformat(o['data'].replace('Z', '+00:00')).year == ano and
               datetime.fromisoformat(o['data'].replace('Z', '+00:00')).month == mes
        ]
        
        if not orcamentos_mes:
            return {'erro': 'Nenhum orçamento encontrado para o período'}
        
        total_orcamentos = len(orcamentos_mes)
        receita_total = sum(o['precoFinal'] for o in orcamentos_mes)
        custo_total = sum(o['custoTotal'] for o in orcamentos_mes)
        lucro_total = receita_total - custo_total
        ticket_medio = receita_total / total_orcamentos if total_orcamentos > 0 else 0
        margem_media = (lucro_total / receita_total * 100) if receita_total > 0 else 0
        
        # Análise por categoria
        categorias = {}
        for o in orcamentos_mes:
            cat = o.get('categoria', 'Sem categoria')
            if cat not in categorias:
                categorias[cat] = {'count': 0, 'receita': 0, 'custo': 0}
            categorias[cat]['count'] += 1
            categorias[cat]['receita'] += o['precoFinal']
            categorias[cat]['custo'] += o['custoTotal']
        
        # Top clientes
        clientes = {}
        for o in orcamentos_mes:
            cliente = o['cliente']
            if cliente not in clientes:
                clientes[cliente] = {'count': 0, 'valor': 0}
            clientes[cliente]['count'] += 1
            clientes[cliente]['valor'] += o['precoFinal']
        
        top_clientes = sorted(clientes.items(), key=lambda x: x[1]['valor'], reverse=True)[:5]
        
        return {
            'periodo': f"{mes:02d}/{ano}",
            'total_orcamentos': total_orcamentos,
            'receita_total': receita_total,
            'custo_total': custo_total,
            'lucro_total': lucro_total,
            'ticket_medio': ticket_medio,
            'margem_media': margem_media,
            'categorias': categorias,
            'top_clientes': top_clientes
        }
    
    def analise_tendencias(self, meses: int = 6) -> Dict:
        """Analisa tendências dos últimos meses"""
        data_limite = datetime.now() - timedelta(days=meses * 30)
        
        orcamentos_periodo = [
            o for o in self.dados_orcamentos 
            if datetime.fromisoformat(o['data'].replace('Z', '+00:00')) >= data_limite
        ]
        
        # Agrupar por mês
        dados_mensais = {}
        for o in orcamentos_periodo:
            data = datetime.fromisoformat(o['data'].replace('Z', '+00:00'))
            chave_mes = f"{data.year}-{data.month:02d}"
            
            if chave_mes not in dados_mensais:
                dados_mensais[chave_mes] = {
                    'orcamentos': 0,
                    'receita': 0,
                    'custo': 0,
                    'lucro': 0
                }
            
            dados_mensais[chave_mes]['orcamentos'] += 1
            dados_mensais[chave_mes]['receita'] += o['precoFinal']
            dados_mensais[chave_mes]['custo'] += o['custoTotal']
            dados_mensais[chave_mes]['lucro'] += (o['precoFinal'] - o['custoTotal'])
        
        # Calcular tendências
        meses_ordenados = sorted(dados_mensais.keys())
        if len(meses_ordenados) >= 2:
            primeiro_mes = dados_mensais[meses_ordenados[0]]
            ultimo_mes = dados_mensais[meses_ordenados[-1]]
            
            crescimento_receita = ((ultimo_mes['receita'] - primeiro_mes['receita']) / 
                                 primeiro_mes['receita'] * 100) if primeiro_mes['receita'] > 0 else 0
            
            crescimento_orcamentos = ((ultimo_mes['orcamentos'] - primeiro_mes['orcamentos']) / 
                                    primeiro_mes['orcamentos'] * 100) if primeiro_mes['orcamentos'] > 0 else 0
        else:
            crescimento_receita = 0
            crescimento_orcamentos = 0
        
        return {
            'dados_mensais': dados_mensais,
            'crescimento_receita': crescimento_receita,
            'crescimento_orcamentos': crescimento_orcamentos,
            'meses_analisados': len(meses_ordenados)
        }
    
    def projecao_financeira(self, meses_futuros: int = 3) -> Dict:
        """Projeta resultados financeiros futuros"""
        # Usar dados dos últimos 3 meses para projeção
        data_limite = datetime.now() - timedelta(days=90)
        
        orcamentos_recentes = [
            o for o in self.dados_orcamentos 
            if datetime.fromisoformat(o['data'].replace('Z', '+00:00')) >= data_limite
        ]
        
        if len(orcamentos_recentes) < 3:
            return {'erro': 'Dados insuficientes para projeção'}
        
        # Calcular médias
        media_orcamentos_mes = len(orcamentos_recentes) / 3
        media_receita_mes = sum(o['precoFinal'] for o in orcamentos_recentes) / 3
        media_custo_mes = sum(o['custoTotal'] for o in orcamentos_recentes) / 3
        media_lucro_mes = media_receita_mes - media_custo_mes
        
        # Projeções
        projecoes = []
        for i in range(1, meses_futuros + 1):
            mes_futuro = datetime.now() + timedelta(days=30 * i)
            projecoes.append({
                'mes': mes_futuro.strftime('%m/%Y'),
                'orcamentos_projetados': int(media_orcamentos_mes),
                'receita_projetada': media_receita_mes,
                'custo_projetado': media_custo_mes,
                'lucro_projetado': media_lucro_mes
            })
        
        return {
            'base_calculo': '3 meses anteriores',
            'media_mensal': {
                'orcamentos': media_orcamentos_mes,
                'receita': media_receita_mes,
                'custo': media_custo_mes,
                'lucro': media_lucro_mes
            },
            'projecoes': projecoes
        }
    
    def analise_lucratividade_categoria(self) -> Dict:
        """Analisa lucratividade por categoria"""
        categorias = {}
        
        for o in self.dados_orcamentos:
            cat = o.get('categoria', 'Sem categoria')
            if cat not in categorias:
                categorias[cat] = {
                    'orcamentos': 0,
                    'receita_total': 0,
                    'custo_total': 0,
                    'lucro_total': 0,
                    'margem_media': 0
                }
            
            categorias[cat]['orcamentos'] += 1
            categorias[cat]['receita_total'] += o['precoFinal']
            categorias[cat]['custo_total'] += o['custoTotal']
            categorias[cat]['lucro_total'] += (o['precoFinal'] - o['custoTotal'])
        
        # Calcular margens
        for cat_data in categorias.values():
            if cat_data['receita_total'] > 0:
                cat_data['margem_media'] = (cat_data['lucro_total'] / cat_data['receita_total']) * 100
        
        # Ordenar por lucratividade
        categorias_ordenadas = sorted(
            categorias.items(), 
            key=lambda x: x[1]['margem_media'], 
            reverse=True
        )
        
        return {
            'categorias': dict(categorias_ordenadas),
            'categoria_mais_lucrativa': categorias_ordenadas[0] if categorias_ordenadas else None,
            'categoria_menos_lucrativa': categorias_ordenadas[-1] if categorias_ordenadas else None
        }

# Exemplo de uso
if __name__ == "__main__":
    relatorio = RelatorioFinanceiro()
    
    # Dados de exemplo
    dados_exemplo = [
        {
            "id": "1",
            "cliente": "Cliente A",
            "categoria": "artesanato",
            "precoFinal": 500,
            "custoTotal": 300,
            "data": "2024-01-15T10:00:00Z"
        },
        {
            "id": "2",
            "cliente": "Cliente B",
            "categoria": "costura",
            "precoFinal": 800,
            "custoTotal": 500,
            "data": "2024-01-20T14:30:00Z"
        },
        {
            "id": "3",
            "cliente": "Cliente A",
            "categoria": "artesanato",
            "precoFinal": 350,
            "custoTotal": 200,
            "data": "2024-02-05T09:15:00Z"
        }
    ]
    
    relatorio.carregar_dados(json.dumps(dados_exemplo))
    
    print("=== RELATÓRIO MENSAL ===")
    relatorio_jan = relatorio.gerar_relatorio_mensal(2024, 1)
    for chave, valor in relatorio_jan.items():
        if isinstance(valor, (int, float)):
            print(f"{chave}: {valor:.2f}")
        elif isinstance(valor, dict):
            print(f"{chave}: {len(valor)} itens")
        else:
            print(f"{chave}: {valor}")
    
    print("\n=== ANÁLISE DE LUCRATIVIDADE ===")
    analise_lucro = relatorio.analise_lucratividade_categoria()
    print("Categorias por lucratividade:")
    for categoria, dados in analise_lucro['categorias'].items():
        print(f"{categoria}: {dados['margem_media']:.1f}% de margem")
    
    print("\n=== PROJEÇÃO FINANCEIRA ===")
    projecao = relatorio.projecao_financeira(3)
    if 'erro' not in projecao:
        print("Projeções para os próximos 3 meses:")
        for proj in projecao['projecoes']:
            print(f"{proj['mes']}: R$ {proj['receita_projetada']:.2f} (receita)")
