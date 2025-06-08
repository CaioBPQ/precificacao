"""
Sistema de Precificação - Calculadora Python
Algoritmos avançados para cálculo de preços
"""

import json
import math
from datetime import datetime
from typing import Dict, List, Tuple

class CalculadoraPrecificacao:
    def __init__(self):
        self.historico_calculos = []
    
    def calcular_preco_basico(self, 
                            custo_materiais: float,
                            horas_trabalho: float,
                            valor_hora: float,
                            margem_lucro: float,
                            impostos: float,
                            despesas_fixas: float = 0) -> Dict:
        """
        Cálculo básico de precificação
        """
        custo_mao_obra = horas_trabalho * valor_hora
        custo_total = custo_materiais + custo_mao_obra + despesas_fixas
        
        # Aplicar margem de lucro
        valor_com_lucro = custo_total * (1 + margem_lucro / 100)
        
        # Aplicar impostos
        preco_final = valor_com_lucro * (1 + impostos / 100)
        
        resultado = {
            'custo_materiais': custo_materiais,
            'custo_mao_obra': custo_mao_obra,
            'despesas_fixas': despesas_fixas,
            'custo_total': custo_total,
            'margem_lucro_valor': custo_total * (margem_lucro / 100),
            'impostos_valor': valor_com_lucro * (impostos / 100),
            'preco_final': preco_final,
            'margem_lucro_percentual': margem_lucro,
            'impostos_percentual': impostos
        }
        
        return resultado
    
    def calcular_preco_competitivo(self,
                                 custo_base: float,
                                 preco_concorrencia: List[float],
                                 posicionamento: str = 'medio') -> Dict:
        """
        Cálculo baseado na concorrência
        posicionamento: 'baixo', 'medio', 'alto'
        """
        if not preco_concorrencia:
            return {'erro': 'Preços da concorrência não fornecidos'}
        
        preco_medio = sum(preco_concorrencia) / len(preco_concorrencia)
        preco_min = min(preco_concorrencia)
        preco_max = max(preco_concorrencia)
        
        if posicionamento == 'baixo':
            preco_sugerido = preco_min * 0.95  # 5% abaixo do menor
        elif posicionamento == 'alto':
            preco_sugerido = preco_max * 1.05  # 5% acima do maior
        else:  # medio
            preco_sugerido = preco_medio
        
        # Verificar se o preço cobre os custos
        margem_real = ((preco_sugerido - custo_base) / custo_base) * 100 if custo_base > 0 else 0
        
        return {
            'preco_sugerido': preco_sugerido,
            'preco_medio_concorrencia': preco_medio,
            'preco_min_concorrencia': preco_min,
            'preco_max_concorrencia': preco_max,
            'margem_real': margem_real,
            'viabilidade': 'viável' if margem_real > 10 else 'atenção' if margem_real > 0 else 'inviável'
        }
    
    def calcular_ponto_equilibrio(self,
                                custos_fixos_mensais: float,
                                custo_variavel_unitario: float,
                                preco_venda: float) -> Dict:
        """
        Calcula o ponto de equilíbrio
        """
        if preco_venda <= custo_variavel_unitario:
            return {'erro': 'Preço de venda deve ser maior que o custo variável'}
        
        margem_contribuicao = preco_venda - custo_variavel_unitario
        ponto_equilibrio_unidades = custos_fixos_mensais / margem_contribuicao
        ponto_equilibrio_valor = ponto_equilibrio_unidades * preco_venda
        
        return {
            'ponto_equilibrio_unidades': math.ceil(ponto_equilibrio_unidades),
            'ponto_equilibrio_valor': ponto_equilibrio_valor,
            'margem_contribuicao': margem_contribuicao,
            'margem_contribuicao_percentual': (margem_contribuicao / preco_venda) * 100
        }
    
    def simular_cenarios(self,
                        custo_base: float,
                        cenarios_margem: List[float]) -> List[Dict]:
        """
        Simula diferentes cenários de margem de lucro
        """
        resultados = []
        
        for margem in cenarios_margem:
            preco = custo_base * (1 + margem / 100)
            lucro = preco - custo_base
            
            resultados.append({
                'margem_percentual': margem,
                'preco_final': preco,
                'lucro_unitario': lucro,
                'roi': margem  # Return on Investment
            })
        
        return resultados
    
    def calcular_desconto_maximo(self,
                               custo_total: float,
                               preco_original: float,
                               margem_minima: float = 10) -> Dict:
        """
        Calcula o desconto máximo possível mantendo margem mínima
        """
        preco_minimo = custo_total * (1 + margem_minima / 100)
        desconto_maximo = preco_original - preco_minimo
        desconto_percentual = (desconto_maximo / preco_original) * 100
        
        return {
            'preco_original': preco_original,
            'preco_minimo': preco_minimo,
            'desconto_maximo_valor': max(0, desconto_maximo),
            'desconto_maximo_percentual': max(0, desconto_percentual),
            'margem_minima': margem_minima
        }
    
    def analisar_sazonalidade(self,
                            vendas_historicas: List[Dict],
                            mes_atual: int) -> Dict:
        """
        Analisa padrões sazonais para ajuste de preços
        vendas_historicas: [{'mes': 1, 'vendas': 100, 'preco_medio': 50}, ...]
        """
        if not vendas_historicas:
            return {'erro': 'Dados históricos não fornecidos'}
        
        # Calcular média anual
        vendas_total = sum(v['vendas'] for v in vendas_historicas)
        meses_com_dados = len(vendas_historicas)
        media_mensal = vendas_total / meses_com_dados if meses_com_dados > 0 else 0
        
        # Encontrar dados do mês atual
        dados_mes_atual = next((v for v in vendas_historicas if v['mes'] == mes_atual), None)
        
        if dados_mes_atual:
            indice_sazonalidade = dados_mes_atual['vendas'] / media_mensal if media_mensal > 0 else 1
            
            # Sugerir ajuste de preço baseado na sazonalidade
            if indice_sazonalidade > 1.2:  # Alta demanda
                ajuste_sugerido = 5  # Aumentar 5%
                estrategia = 'Aumentar preço - alta demanda'
            elif indice_sazonalidade < 0.8:  # Baixa demanda
                ajuste_sugerido = -10  # Diminuir 10%
                estrategia = 'Reduzir preço - baixa demanda'
            else:
                ajuste_sugerido = 0
                estrategia = 'Manter preço atual'
            
            return {
                'indice_sazonalidade': indice_sazonalidade,
                'media_mensal': media_mensal,
                'vendas_mes_atual': dados_mes_atual['vendas'],
                'ajuste_preco_sugerido': ajuste_sugerido,
                'estrategia': estrategia
            }
        
        return {'erro': f'Dados para o mês {mes_atual} não encontrados'}

# Exemplo de uso
if __name__ == "__main__":
    calc = CalculadoraPrecificacao()
    
    # Teste 1: Cálculo básico
    print("=== CÁLCULO BÁSICO ===")
    resultado_basico = calc.calcular_preco_basico(
        custo_materiais=100,
        horas_trabalho=5,
        valor_hora=50,
        margem_lucro=30,
        impostos=8,
        despesas_fixas=20
    )
    
    for chave, valor in resultado_basico.items():
        print(f"{chave}: R$ {valor:.2f}")
    
    print("\n=== ANÁLISE COMPETITIVA ===")
    # Teste 2: Análise competitiva
    resultado_competitivo = calc.calcular_preco_competitivo(
        custo_base=370,
        preco_concorrencia=[400, 450, 380, 420, 390],
        posicionamento='medio'
    )
    
    for chave, valor in resultado_competitivo.items():
        if isinstance(valor, (int, float)):
            print(f"{chave}: R$ {valor:.2f}")
        else:
            print(f"{chave}: {valor}")
    
    print("\n=== PONTO DE EQUILÍBRIO ===")
    # Teste 3: Ponto de equilíbrio
    resultado_equilibrio = calc.calcular_ponto_equilibrio(
        custos_fixos_mensais=5000,
        custo_variavel_unitario=200,
        preco_venda=400
    )
    
    for chave, valor in resultado_equilibrio.items():
        if isinstance(valor, (int, float)):
            print(f"{chave}: {valor:.2f}")
        else:
            print(f"{chave}: {valor}")
    
    print("\n=== SIMULAÇÃO DE CENÁRIOS ===")
    # Teste 4: Simulação de cenários
    cenarios = calc.simular_cenarios(
        custo_base=300,
        cenarios_margem=[20, 30, 40, 50]
    )
    
    for i, cenario in enumerate(cenarios):
        print(f"Cenário {i+1}:")
        for chave, valor in cenario.items():
            print(f"  {chave}: {valor:.2f}")
        print()
    
    print("=== DESCONTO MÁXIMO ===")
    # Teste 5: Desconto máximo
    resultado_desconto = calc.calcular_desconto_maximo(
        custo_total=300,
        preco_original=450,
        margem_minima=15
    )
    
    for chave, valor in resultado_desconto.items():
        print(f"{chave}: R$ {valor:.2f}")
