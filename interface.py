# interface.py (CORRIGIDO)
import customtkinter as ctk
from tkinter import messagebox
import database
from core import CalculadoraDePrecos
import os
import sys

# Função para garantir que os arquivos de dados sejam encontrados
def resource_path(relative_path):
    """ Retorna o caminho absoluto para o recurso, funcionando em dev e no PyInstaller """
    try:
        # PyInstaller cria uma pasta temp e armazena o caminho em _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

ctk.set_appearance_mode("system")
ctk.set_default_color_theme("blue")

# Usando a função para definir os caminhos dos arquivos
ARQUIVO_CONFIG = resource_path('config.json')
ARQUIVO_MATERIAIS = resource_path('materiais.json')
ARQUIVO_PRODUTOS = resource_path('produtos.json')

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Precificação de Produtos")
        self.geometry("600x400")
        self.resizable(False, False)
        self.main_menu()

    def main_menu(self):
        for widget in self.winfo_children():
            widget.destroy()
        ctk.CTkLabel(self, text="Precificação", font=("Arial", 24)).pack(pady=20)
        ctk.CTkButton(self, text="1. Configurar Custos Fixos", command=self.configurar_custos).pack(pady=10)
        ctk.CTkButton(self, text="2. Gerenciar Matérias-Primas", command=self.gerenciar_materiais).pack(pady=10)
        ctk.CTkButton(self, text="3. Calcular Preço de Produto", command=self.calcular_preco).pack(pady=10)
        ctk.CTkButton(self, text="4. Listar Produtos", command=self.listar_produtos).pack(pady=10)
        ctk.CTkButton(self, text="Sair", command=self.destroy).pack(pady=20)

    def configurar_custos(self):
        janela = ctk.CTkToplevel(self)
        janela.title("Custos Fixos")
        janela.geometry("500x500")
        entradas = []
        lista_frame = ctk.CTkScrollableFrame(janela)
        lista_frame.pack(pady=10, fill="both", expand=True)
        def adicionar_entrada():
            frame = ctk.CTkFrame(lista_frame)
            frame.pack(pady=2, padx=10, fill="x")
            desc = ctk.CTkEntry(frame, placeholder_text="Descrição do custo fixo (ex: aluguel, internet)")
            val = ctk.CTkEntry(frame, placeholder_text="Valor mensal (R$)")
            desc.pack(side="left", fill="x", expand=True, padx=(0, 5))
            val.pack(side="left", fill="x", expand=True)
            entradas.append((desc, val))
        adicionar_entrada()
        ctk.CTkButton(janela, text="Adicionar Custo Fixo", command=adicionar_entrada).pack(pady=5)
        horas_entry = ctk.CTkEntry(janela, placeholder_text="Horas de trabalho por dia (ex: 8)")
        dias_entry = ctk.CTkEntry(janela, placeholder_text="Dias de trabalho por semana (ex: 5)")
        horas_entry.pack(pady=5)
        dias_entry.pack(pady=5)
        def salvar():
            try:
                horas = float(horas_entry.get())
                dias = int(dias_entry.get())
                custos = []
                for desc, val in entradas:
                    d = desc.get()
                    if d and val.get():
                        v = float(val.get())
                        custos.append({"descricao": d, "valor": v})
                config = {"horas_trabalho_dia": horas, "dias_trabalho_semana": dias, "custos_fixos": custos}
                database.salvar_dados(ARQUIVO_CONFIG, config)
                messagebox.showinfo("Sucesso", "Configurações salvas!")
                janela.destroy()
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao salvar: {e}")
        ctk.CTkButton(janela, text="Salvar", command=salvar).pack(pady=10)

    def gerenciar_materiais(self):
        janela = ctk.CTkToplevel(self)
        janela.title("Matérias-Primas")
        janela.geometry("500x400")
        materiais = database.carregar_dados(ARQUIVO_MATERIAIS)
        lista = ctk.CTkTextbox(janela, height=200)
        lista.pack(pady=10, fill="both", expand=True)
        def atualizar_lista():
            lista.configure(state="normal")
            lista.delete("1.0", "end")
            for m in materiais:
                if m['qtd_pacote'] > 0:
                    unit = m['preco_pacote'] / m['qtd_pacote']
                    lista.insert("end", f"{m['nome']} - R$ {unit:.4f}/un\n")
            lista.configure(state="disabled")
        atualizar_lista()
        nome = ctk.CTkEntry(janela, placeholder_text="Nome do material (ex: Farinha)")
        preco = ctk.CTkEntry(janela, placeholder_text="Preço do Pacote (R$)")
        qtd = ctk.CTkEntry(janela, placeholder_text="Quantidade no pacote (g, ml, un)")
        nome.pack(pady=2); preco.pack(pady=2); qtd.pack(pady=2)
        def salvar():
            try:
                m = {"nome": nome.get(), "preco_pacote": float(preco.get()), "qtd_pacote": float(qtd.get())}
                if not m["nome"] or m["preco_pacote"] <= 0 or m["qtd_pacote"] <= 0:
                    messagebox.showerror("Erro", "Todos os campos são obrigatórios e valores devem ser positivos.")
                    return
                materiais.append(m)
                database.salvar_dados(ARQUIVO_MATERIAIS, materiais)
                atualizar_lista()
                nome.delete(0, "end"); preco.delete(0, "end"); qtd.delete(0, "end")
            except Exception as e:
                messagebox.showerror("Erro", f"Entrada inválida: {e}")
        ctk.CTkButton(janela, text="Salvar Matéria-Prima", command=salvar).pack(pady=10)

    def calcular_preco(self):
        config = database.carregar_config()
        materiais = database.carregar_dados(ARQUIVO_MATERIAIS)
        if not config or not materiais:
            messagebox.showerror("Erro", "Configure os custos e cadastre matérias-primas primeiro.")
            return
        janela = ctk.CTkToplevel(self); janela.title("Novo Produto"); janela.geometry("600x600")
        entradas_receita = []
        produto_nome = ctk.CTkEntry(janela, placeholder_text="Nome do Produto"); tempo = ctk.CTkEntry(janela, placeholder_text="Tempo de Produção (minutos)")
        embalagem = ctk.CTkEntry(janela, placeholder_text="Custo da Embalagem (R$)"); lucro = ctk.CTkEntry(janela, placeholder_text="Margem de Lucro (%)")
        taxas = ctk.CTkEntry(janela, placeholder_text="Taxas (% impostos, maquininha)")
        produto_nome.pack(pady=2); tempo.pack(pady=2); embalagem.pack(pady=2); lucro.pack(pady=2); taxas.pack(pady=2)
        frame_receita = ctk.CTkScrollableFrame(janela); frame_receita.pack(pady=5, fill="both", expand=True)
        def adicionar_item():
            frame = ctk.CTkFrame(frame_receita); frame.pack(pady=2, fill="x")
            mat_cb = ctk.CTkOptionMenu(frame, values=[m['nome'] for m in materiais])
            qtd = ctk.CTkEntry(frame, placeholder_text="Quantidade usada (g, ml, un)")
            mat_cb.pack(side="left", padx=5, expand=True, fill="x"); qtd.pack(side="left", padx=5, expand=True, fill="x")
            entradas_receita.append((mat_cb, qtd))
        adicionar_item()
        ctk.CTkButton(janela, text="Adicionar Material", command=adicionar_item).pack(pady=5)
        def calcular():
            try:
                receita = []
                for mat_cb, qtd_entry in entradas_receita:
                    nome_material = mat_cb.get(); qtd_val = qtd_entry.get()
                    if nome_material and qtd_val:
                        material = next(m for m in materiais if m['nome'] == nome_material)
                        receita.append({"material": material, "qtd_usada": float(qtd_val)})
                produto = {"nome": produto_nome.get(), "tempo_producao_minutos": float(tempo.get()),"custo_embalagem": float(embalagem.get()), "receita": receita}
                calc = CalculadoraDePrecos(config)
                resultado = calc.calcular_preco_final(produto, float(lucro.get()), float(taxas.get()))
                if resultado:
                    msg = f"Preço sugerido: R$ {resultado['preco_venda_sugerido']:.2f}\nCusto total: R$ {resultado['custo_total_producao']:.2f}"
                    if messagebox.askyesno("Resultado", msg + "\nDeseja salvar?"):
                        produto['preco_final'] = resultado['preco_venda_sugerido']
                        produtos = database.carregar_dados(ARQUIVO_PRODUTOS); produtos.append(produto)
                        database.salvar_dados(ARQUIVO_PRODUTOS, produtos)
                        janela.destroy()
            except Exception as e:
                messagebox.showerror("Erro", f"Erro no cálculo: {e}")
        ctk.CTkButton(janela, text="Calcular Preço", command=calcular).pack(pady=10)

    def listar_produtos(self):
        produtos = database.carregar_dados(ARQUIVO_PRODUTOS)
        janela = ctk.CTkToplevel(self); janela.title("Produtos Salvos"); janela.geometry("500x400")
        lista = ctk.CTkTextbox(janela); lista.pack(pady=10, fill="both", expand=True)
        if not produtos:
            lista.insert("end", "Nenhum produto salvo.")
        else:
            for p in produtos:
                lista.insert("end", f"{p['nome']} - R$ {p.get('preco_final', 0):.2f}\n")
        lista.configure(state="disabled")

if __name__ == "__main__":
    app = App()
    app.mainloop()