"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, Download, Upload, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Configuracoes {
  empresa: {
    nome: string
    cnpj: string
    endereco: string
    telefone: string
    email: string
  }
  padroes: {
    margemLucro: number
    impostos: number
    valorHoraPadrao: number
    despesasFixasPadrao: number
  }
  notificacoes: {
    emailOrcamentos: boolean
    lembreteFollowUp: boolean
  }
}

const configuracoesIniciais: Configuracoes = {
  empresa: {
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
  },
  padroes: {
    margemLucro: 30,
    impostos: 8,
    valorHoraPadrao: 50,
    despesasFixasPadrao: 0,
  },
  notificacoes: {
    emailOrcamentos: false,
    lembreteFollowUp: false,
  },
}

export function ConfiguracoesSistema() {
  const { toast } = useToast()
  const [config, setConfig] = useState<Configuracoes>(configuracoesIniciais)

  useEffect(() => {
    const configSalva = localStorage.getItem("configuracoes")
    if (configSalva) {
      setConfig(JSON.parse(configSalva))
    }
  }, [])

  const salvarConfiguracoes = () => {
    localStorage.setItem("configuracoes", JSON.stringify(config))
    toast({
      title: "Configurações salvas",
      description: "Suas configurações foram salvas com sucesso",
    })
  }

  const exportarDados = () => {
    const orcamentos = localStorage.getItem("orcamentos") || "[]"
    const configuracoes = localStorage.getItem("configuracoes") || "{}"

    const dados = {
      orcamentos: JSON.parse(orcamentos),
      configuracoes: JSON.parse(configuracoes),
      dataExportacao: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `backup-precificacao-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Backup criado",
      description: "Seus dados foram exportados com sucesso",
    })
  }

  const importarDados = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target?.result as string)

        if (dados.orcamentos) {
          localStorage.setItem("orcamentos", JSON.stringify(dados.orcamentos))
        }

        if (dados.configuracoes) {
          localStorage.setItem("configuracoes", JSON.stringify(dados.configuracoes))
          setConfig(dados.configuracoes)
        }

        toast({
          title: "Dados importados",
          description: "Seus dados foram restaurados com sucesso",
        })
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "Arquivo inválido ou corrompido",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const limparTodosDados = () => {
    if (confirm("Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.")) {
      localStorage.removeItem("orcamentos")
      localStorage.removeItem("configuracoes")
      setConfig(configuracoesIniciais)

      toast({
        title: "Dados limpos",
        description: "Todos os dados foram removidos do sistema",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Configure os dados da sua empresa para aparecer nos orçamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
              <Input
                id="nomeEmpresa"
                value={config.empresa.nome}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    empresa: { ...config.empresa, nome: e.target.value },
                  })
                }
                placeholder="Nome da sua empresa"
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={config.empresa.cnpj}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    empresa: { ...config.empresa, cnpj: e.target.value },
                  })
                }
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={config.empresa.endereco}
              onChange={(e) =>
                setConfig({
                  ...config,
                  empresa: { ...config.empresa, endereco: e.target.value },
                })
              }
              placeholder="Endereço completo da empresa"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={config.empresa.telefone}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    empresa: { ...config.empresa, telefone: e.target.value },
                  })
                }
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={config.empresa.email}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    empresa: { ...config.empresa, email: e.target.value },
                  })
                }
                placeholder="contato@empresa.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Padrão</CardTitle>
          <CardDescription className="dark:text-gray-400">Defina valores padrão para novos orçamentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="margemPadrao">Margem de Lucro Padrão (%)</Label>
              <Input
                id="margemPadrao"
                type="number"
                value={config.padroes.margemLucro}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    padroes: { ...config.padroes, margemLucro: Number(e.target.value) },
                  })
                }
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="impostosPadrao">Impostos Padrão (%)</Label>
              <Input
                id="impostosPadrao"
                type="number"
                value={config.padroes.impostos}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    padroes: { ...config.padroes, impostos: Number(e.target.value) },
                  })
                }
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valorHoraPadrao">Valor Hora Padrão (R$)</Label>
              <Input
                id="valorHoraPadrao"
                type="number"
                value={config.padroes.valorHoraPadrao}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    padroes: { ...config.padroes, valorHoraPadrao: Number(e.target.value) },
                  })
                }
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="despesasPadrao">Despesas Fixas Padrão (R$)</Label>
              <Input
                id="despesasPadrao"
                type="number"
                value={config.padroes.despesasFixasPadrao}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    padroes: { ...config.padroes, despesasFixasPadrao: Number(e.target.value) },
                  })
                }
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup e Restauração</CardTitle>
          <CardDescription className="dark:text-gray-400">Gerencie seus dados do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={exportarDados} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Dados
            </Button>

            <div>
              <input type="file" accept=".json" onChange={importarDados} style={{ display: "none" }} id="importFile" />
              <Button onClick={() => document.getElementById("importFile")?.click()} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Importar Dados
              </Button>
            </div>

            <Button onClick={limparTodosDados} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Todos os Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={salvarConfiguracoes} className="w-full md:w-auto">
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
