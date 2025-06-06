# interface.py (refatorado)
import customtkinter as ctk
from tkinter import messagebox
import database
from core import CalculadoraDePrecos
import os
import sys

ctk.set_appearance_mode("system")
ctk.set_default_color_theme("blue")

def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

ARQUIVO_CONFIG = resource_path('config.json')
ARQUIVO_MATERIAIS = resource_path('materiais.json')
ARQUIVO_PRODUTOS = resource_path('produtos.json')

def limpar_widget(widget):
    for w in widget.winfo_children():
        w.destroy()

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Precificação de Produtos")
        self.geometry("600x400")
        self.resizable(False, False)
        self.main_menu()

    def main_menu(self):
        limpar_widget(self)
        ctk.CTkLabel(self, text="Precificação", font=("Arial", 24)).pack(pady=20)
        botoes = [
            ("1. Configurar Custos Fixos", self.configurar_custos),
            ("2. Gerenciar Matérias-Primas", self.gerenciar_materiais),
            ("3. Calcular Preço de Produto", self.calcular_preco),
            ("4. Listar Produtos", self.listar_produtos),
            ("Sair", self.destroy)
        ]
        for texto, comando in botoes:
            ctk.CTkButton(self, text=texto, command=comando).pack(pady=10)

    def configurar_custos(self):
        janela = ctk.CTkToplevel(self)
        janela.title("Custos Fixos")
        janela.geometry("500x500")
        entradas = []
        frame_scroll = ctk.CTkScrollableFrame(janela)
        frame_scroll.pack(pady=10, fill="both", expand=True)

        def adicionar():
            frame = ctk.CTkFrame(frame_scroll)
            frame.pack(pady=2, padx=10, fill="x")
            desc = ctk.CTkEntry(frame, placeholder_text="Descrição")
            val = ctk.CTkEntry(frame, placeholder_text="Valor (R$)")
            desc.pack(side="left", expand=True, padx=(0, 5))
            val.pack(side="left", expand=True)
            entradas.append((desc, val))

        adicionar()
        ctk.CTkButton(janela, text="Adicionar Custo", command=adicionar).pack()
        horas = ctk.CTkEntry(janela, placeholder_text="Horas/dia")
        dias = ctk.CTkEntry(janela, placeholder_text="Dias/semana")
        horas.pack(pady=5); dias.pack(pady=5)

        def salvar():
            try:
                custos = []
                for d, v in entradas:
                    if d.get() and v.get():
                        custos.append({"descricao": d.get(), "valor": float(v.get())})
                config = {
                    "horas_trabalho_dia": float(horas.get()),
                    "dias_trabalho_semana": float(dias.get()),
                    "custos_fixos": custos
                }
                database.salvar_dados(ARQUIVO_CONFIG, config)
                messagebox.showinfo("Sucesso", "Configurações salvas!")
                janela.destroy()
            except Exception as e:
                messagebox.showerror("Erro", f"Erro: {e}")

        ctk.CTkButton(janela, text="Salvar", command=salvar).pack(pady=10)

    def gerenciar_materiais(self):
        janela = ctk.CTkToplevel(self)
        janela.title("Matérias-Primas")
        janela.geometry("500x400")
        materiais = database.carregar_dados(ARQUIVO_MATERIAIS)

        lista = ctk.CTkTextbox(janela, height=200)
        lista.pack(pady=10, fill="both", expand=True)

        def atualizar():
            lista.configure(state="normal")
            lista.delete("1.0", "end")
            for m in materiais:
                unit = m['preco_pacote'] / m['qtd_pacote']
                lista.insert("end", f"{m['nome']} - R$ {unit:.4f}/un\n")
            lista.configure(state="disabled")

        atualizar()
        nome = ctk.CTkEntry(janela, placeholder_text="Nome")
        preco = ctk.CTkEntry(janela, placeholder_text="Preço pacote (R$)")
        qtd = ctk.CTkEntry(janela, placeholder_text="Qtd pacote")
        nome.pack(pady=2); preco.pack(pady=2); qtd.pack(pady=2)

        def salvar():
            try:
                m = {
                    "nome": nome.get(),
                    "preco_pacote": float(preco.get()),
                    "qtd_pacote": float(qtd.get())
                }
                if m["preco_pacote"] <= 0 or m["qtd_pacote"] <= 0:
                    raise ValueError("Valores devem ser positivos.")
                materiais.append(m)
                database.salvar_dados(ARQUIVO_MATERIAIS, materiais)
                atualizar()
                nome.delete(0, "end"); preco.delete(0, "end"); qtd.delete(0, "end")
            except Exception as e:
                messagebox.showerror("Erro", f"Erro: {e}")

        ctk.CTkButton(janela, text="Salvar Matéria-Prima", command=salvar).pack(pady=10)

    def calcular_preco(self):
        config = database.carregar_config()
        materiais = database.carregar_dados(ARQUIVO_MATERIAIS)
        if not config or not materiais:
            messagebox.showerror("Erro", "Configure os custos e cadastre matérias-primas primeiro.")
            return

        janela = ctk.CTkToplevel(self); janela.title("Novo Produto"); janela.geometry("600x600")
        entradas = []

        nome = ctk.CTkEntry(janela, placeholder_text="Nome do Produto")
        tempo = ctk.CTkEntry(janela, placeholder_text="Tempo Produção (min)")
        embalagem = ctk.CTkEntry(janela, placeholder_text="Custo Embalagem (R$)")
        lucro = ctk.CTkEntry(janela, placeholder_text="Margem Lucro (%)")
        taxas = ctk.CTkEntry(janela, placeholder_text="Taxas (%)")
        nome.pack(); tempo.pack(); embalagem.pack(); lucro.pack(); taxas.pack()

        frame = ctk.CTkScrollableFrame(janela); frame.pack(pady=5, fill="both", expand=True)

        def adicionar_item():
            linha = ctk.CTkFrame(frame); linha.pack(pady=2, fill="x")
            mat_cb = ctk.CTkOptionMenu(linha, values=[m['nome'] for m in materiais])
            qtd = ctk.CTkEntry(linha, placeholder_text="Qtd usada")
            mat_cb.pack(side="left", padx=5, fill="x", expand=True)
            qtd.pack(side="left", padx=5, fill="x", expand=True)
            entradas.append((mat_cb, qtd))

        adicionar_item()
        ctk.CTkButton(janela, text="Adicionar Material", command=adicionar_item).pack(pady=5)

        def calcular():
            try:
                receita = []
                for mat_cb, qtd_entry in entradas:
                    nome_mat = mat_cb.get()
                    mat = next(m for m in materiais if m['nome'] == nome_mat)
                    receita.append({"material": mat, "qtd_usada": float(qtd_entry.get())})

                produto = {
                    "nome": nome.get(),
                    "tempo_producao_minutos": float(tempo.get()),
                    "custo_embalagem": float(embalagem.get()),
                    "receita": receita
                }
                calc = CalculadoraDePrecos(config)
                resultado = calc.calcular_preco_final(produto, float(lucro.get()), float(taxas.get()))

                if resultado:
                    msg = f"Preço sugerido: R$ {resultado['preco_venda_sugerido']:.2f}\nCusto total: R$ {resultado['custo_total_producao']:.2f}"
                    if messagebox.askyesno("Resultado", msg + "\nDeseja salvar?"):
                        produto['preco_final'] = resultado['preco_venda_sugerido']
                        produtos = database.carregar_dados(ARQUIVO_PRODUTOS)
                        produtos.append(produto)
                        database.salvar_dados(ARQUIVO_PRODUTOS, produtos)
                        janela.destroy()
            except Exception as e:
                messagebox.showerror("Erro", f"Erro: {e}")

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
