"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Material {
  id: string
  nome: string
  quantidade: number
  valorUnitario: number
  total: number
}

interface Orcamento {
  id: string
  cliente: string
  descricao: string
  categoria: string
  materiais: Material[]
  horasTrabalhadas: number
  valorHora: number
  margemLucro: number
  impostos: number
  despesasFixas: number
  custoTotal: number
  precoFinal: number
  data: string
}

export function CalculadoraPrecos() {
  const { toast } = useToast()
  const [cliente, setCliente] = useState("")
  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState("")
  const [materiais, setMateriais] = useState<Material[]>([])
  const [horasTrabalhadas, setHorasTrabalhadas] = useState(0)
  const [valorHora, setValorHora] = useState(0)
  const [margemLucro, setMargemLucro] = useState(30)
  const [impostos, setImpostos] = useState(8)
  const [despesasFixas, setDespesasFixas] = useState(0)
  const [custoTotal, setCustoTotal] = useState(0)
  const [precoFinal, setPrecoFinal] = useState(0)

  const adicionarMaterial = () => {
    const novoMaterial: Material = {
      id: Date.now().toString(),
      nome: "",
      quantidade: 1,
      valorUnitario: 0,
      total: 0,
    }
    setMateriais([...materiais, novoMaterial])
  }

  const removerMaterial = (id: string) => {
    setMateriais(materiais.filter((m) => m.id !== id))
  }

  const atualizarMaterial = (id: string, campo: keyof Material, valor: any) => {
    setMateriais(
      materiais.map((m) => {
        if (m.id === id) {
          const materialAtualizado = { ...m, [campo]: valor }
          if (campo === "quantidade" || campo === "valorUnitario") {
            materialAtualizado.total = materialAtualizado.quantidade * materialAtualizado.valorUnitario
          }
          return materialAtualizado
        }
        return m
      }),
    )
  }

  const calcularPreco = () => {
    const custoMateriais = materiais.reduce((total, m) => total + m.total, 0)
    const custoMaoObra = horasTrabalhadas * valorHora
    const custoBase = custoMateriais + custoMaoObra + despesasFixas

    const valorComLucro = custoBase * (1 + margemLucro / 100)
    const valorComImpostos = valorComLucro * (1 + impostos / 100)

    setCustoTotal(custoBase)
    setPrecoFinal(valorComImpostos)
  }

  const salvarOrcamento = () => {
    if (!cliente || !descricao) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o cliente e a descrição do trabalho",
        variant: "destructive",
      })
      return
    }

    const orcamento: Orcamento = {
      id: Date.now().toString(),
      cliente,
      descricao,
      categoria,
      materiais,
      horasTrabalhadas,
      valorHora,
      margemLucro,
      impostos,
      despesasFixas,
      custoTotal,
      precoFinal,
      data: new Date().toISOString(),
    }

    const orcamentos = JSON.parse(localStorage.getItem("orcamentos") || "[]")
    orcamentos.push(orcamento)
    localStorage.setItem("orcamentos", JSON.stringify(orcamentos))

    toast({
      title: "Sucesso!",
      description: "Orçamento salvo com sucesso",
    })

    // Limpar formulário
    setCliente("")
    setDescricao("")
    setCategoria("")
    setMateriais([])
    setHorasTrabalhadas(0)
    setValorHora(0)
    setDespesasFixas(0)
    setCustoTotal(0)
    setPrecoFinal(0)
  }

  useEffect(() => {
    calcularPreco()
  }, [materiais, horasTrabalhadas, valorHora, margemLucro, impostos, despesasFixas])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
            <CardDescription>Dados básicos do trabalho a ser orçado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artesanato">Artesanato</SelectItem>
                    <SelectItem value="costura">Costura</SelectItem>
                    <SelectItem value="marcenaria">Marcenaria</SelectItem>
                    <SelectItem value="pintura">Pintura</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="consultoria">Consultoria</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="descricao">Descrição do Trabalho</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva detalhadamente o trabalho a ser realizado"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Materiais e Insumos
              <Button onClick={adicionarMaterial} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {materiais.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum material adicionado</p>
            ) : (
              <div className="space-y-4">
                {materiais.map((material) => (
                  <div key={material.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label>Material</Label>
                      <Input
                        value={material.nome}
                        onChange={(e) => atualizarMaterial(material.id, "nome", e.target.value)}
                        placeholder="Nome do material"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Qtd</Label>
                      <Input
                        type="number"
                        value={material.quantidade}
                        onChange={(e) => atualizarMaterial(material.id, "quantidade", Number(e.target.value))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Valor Unit.</Label>
                      <Input
                        type="number"
                        value={material.valorUnitario}
                        onChange={(e) => atualizarMaterial(material.id, "valorUnitario", Number(e.target.value))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input value={material.total.toFixed(2)} readOnly className="bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div className="col-span-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerMaterial(material.id)}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mão de Obra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="horas">Horas Trabalhadas</Label>
                <Input
                  id="horas"
                  type="number"
                  value={horasTrabalhadas}
                  onChange={(e) => setHorasTrabalhadas(Number(e.target.value))}
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <Label htmlFor="valorHora">Valor por Hora (R$)</Label>
                <Input
                  id="valorHora"
                  type="number"
                  value={valorHora}
                  onChange={(e) => setValorHora(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Preço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="margem">Margem de Lucro (%)</Label>
              <Input
                id="margem"
                type="number"
                value={margemLucro}
                onChange={(e) => setMargemLucro(Number(e.target.value))}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="impostos">Impostos (%)</Label>
              <Input
                id="impostos"
                type="number"
                value={impostos}
                onChange={(e) => setImpostos(Number(e.target.value))}
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="despesas">Despesas Fixas (R$)</Label>
              <Input
                id="despesas"
                type="number"
                value={despesasFixas}
                onChange={(e) => setDespesasFixas(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Materiais:</span>
                <span>R$ {materiais.reduce((total, m) => total + m.total, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mão de Obra:</span>
                <span>R$ {(horasTrabalhadas * valorHora).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesas Fixas:</span>
                <span>R$ {despesasFixas.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Custo Total:</span>
                <span>R$ {custoTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Margem de Lucro ({margemLucro}%):</span>
                <span>R$ {((custoTotal * margemLucro) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Impostos ({impostos}%):</span>
                <span>R$ {((custoTotal * (1 + margemLucro / 100) * impostos) / 100).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>Preço Final:</span>
                <span>R$ {precoFinal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button onClick={salvarOrcamento} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Salvar Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
