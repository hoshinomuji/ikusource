"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Wifi, Server, Database, Globe, MoreVertical, CheckCircle2, XCircle, LayoutGrid, Layers, Settings, Link, Hash, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { createDirectAdminConfig, deleteDirectAdminConfig, testDirectAdminConnection, updateDirectAdminConfig } from "@/app/actions/admin-hosting-config"
import { createHostingCategory, deleteHostingCategory, updateHostingCategory } from "@/app/actions/admin-hosting-categories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

interface DirectAdminConfig {
  id: number
  resellerUsername: string
  resellerPassword: string
  serverIp: string
  panelUrl: string
  nameserver1: string
  nameserver2: string
  isActive: boolean
}

interface HostingCategory {
  id: number
  name: string
  description: string | null
  icon: string | null
  configId: number | null
  displayOrder: number
  isActive: boolean
}

type ConfigFormState = {
  resellerUsername: string
  resellerPassword: string
  serverIp: string
  panelUrl: string
  nameserver1: string
  nameserver2: string
  isActive: boolean
}

type CategoryFormState = {
  name: string
  description: string
  icon: string
  configId: string
  displayOrder: string
  isActive: boolean
}

const defaultConfigForm: ConfigFormState = {
  resellerUsername: "",
  resellerPassword: "",
  serverIp: "",
  panelUrl: "",
  nameserver1: "",
  nameserver2: "",
  isActive: true,
}

const defaultCategoryForm: CategoryFormState = {
  name: "",
  description: "",
  icon: "",
  configId: "",
  displayOrder: "0",
  isActive: true,
}

export function AdminHostingConfigClient({ configs, categories = [] }: { configs: DirectAdminConfig[]; categories?: HostingCategory[] }) {
  const [isPending, startTransition] = useTransition()

  const [editingConfig, setEditingConfig] = useState<DirectAdminConfig | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [configForm, setConfigForm] = useState<ConfigFormState>(defaultConfigForm)

  const [editingCategory, setEditingCategory] = useState<HostingCategory | null>(null)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(defaultCategoryForm)

  const openCreateConfig = () => {
    setEditingConfig(null)
    setConfigForm(defaultConfigForm)
    setShowConfigDialog(true)
  }

  const openEditConfig = (config: DirectAdminConfig) => {
    setEditingConfig(config)
    setConfigForm({
      resellerUsername: config.resellerUsername,
      resellerPassword: config.resellerPassword,
      serverIp: config.serverIp,
      panelUrl: config.panelUrl,
      nameserver1: config.nameserver1,
      nameserver2: config.nameserver2,
      isActive: config.isActive,
    })
    setShowConfigDialog(true)
  }

  const openCreateCategory = () => {
    setEditingCategory(null)
    setCategoryForm(defaultCategoryForm)
    setShowCategoryDialog(true)
  }

  const openEditCategory = (category: HostingCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      configId: category.configId ? String(category.configId) : "",
      displayOrder: String(category.displayOrder),
      isActive: category.isActive,
    })
    setShowCategoryDialog(true)
  }

  const saveConfig = () => {
    startTransition(async () => {
      const formData = new FormData()
      if (editingConfig) formData.append("id", String(editingConfig.id))
      formData.append("resellerUsername", configForm.resellerUsername)
      formData.append("resellerPassword", configForm.resellerPassword)
      formData.append("serverIp", configForm.serverIp)
      formData.append("panelUrl", configForm.panelUrl)
      formData.append("nameserver1", configForm.nameserver1)
      formData.append("nameserver2", configForm.nameserver2)
      formData.append("isActive", String(configForm.isActive))

      const result = editingConfig ? await updateDirectAdminConfig(formData) : await createDirectAdminConfig(formData)
      if (!result.success) {
        toast.error(result.error || "Save failed")
        return
      }

      toast.success(editingConfig ? "DirectAdmin config updated" : "DirectAdmin config created")
      setShowConfigDialog(false)
      window.location.reload()
    })
  }

  const removeConfig = (id: number) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
    startTransition(async () => {
      const result = await deleteDirectAdminConfig(id)
      if (!result.success) {
        toast.error(result.error || "Delete failed")
        return
      }
      toast.success("DirectAdmin config deleted")
      window.location.reload()
    })
  }

  const testConfig = (id: number) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        const result = await testDirectAdminConnection(id)
        if (result.success) resolve(result.message)
        else reject(result.error)
      }),
      {
        loading: 'Testing connection...',
        success: (msg) => `${msg || 'Connection successful'}`,
        error: (err) => `${err || 'Connection failed'}`,
      }
    )
  }

  const saveCategory = () => {
    startTransition(async () => {
      const formData = new FormData()
      if (editingCategory) formData.append("id", String(editingCategory.id))
      formData.append("name", categoryForm.name)
      formData.append("description", categoryForm.description)
      formData.append("icon", categoryForm.icon)
      formData.append("configId", categoryForm.configId)
      formData.append("displayOrder", categoryForm.displayOrder)
      formData.append("isActive", String(categoryForm.isActive))

      const result = editingCategory ? await updateHostingCategory(formData) : await createHostingCategory(formData)
      if (!result.success) {
        toast.error(result.error || "Save failed")
        return
      }

      toast.success(editingCategory ? "Category updated" : "Category created")
      setShowCategoryDialog(false)
      window.location.reload()
    })
  }

  const removeCategory = (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    startTransition(async () => {
      const result = await deleteHostingCategory(id)
      if (!result.success) {
        toast.error(result.error || "Delete failed")
        return
      }
      toast.success("Category deleted")
      window.location.reload()
    })
  }

  return (
    <div className="relative z-10 space-y-12">
      {/* Aurora Background */}
      <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
      <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
          >
            Config Hosting
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Setup and manage your DirectAdmin server integrations and organize them into beautiful categories.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={openCreateCategory}
            variant="outline"
            className="h-10 px-6 rounded-xl bg-white/5 border-white/[0.08] hover:bg-white/10 text-white font-medium transition-all"
          >
            <Layers className="h-4 w-4 mr-2 text-purple-400" />
            Add Category
          </Button>
          <Button
            onClick={openCreateConfig}
            className="h-10 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 font-medium shadow-lg shadow-blue-900/20 border-0"
          >
            <Server className="h-4 w-4 mr-2" />
            Add Server Config
          </Button>
        </motion.div>
      </div>

      {/* Servers Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">DirectAdmin Servers</h2>
            <Badge variant="outline" className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border-cyan-500/20">{configs.length}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {configs.map((config, index) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08] flex flex-col"
            >
              {/* Card Header & Status */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Server className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl group-hover:text-cyan-400 transition-colors">{config.resellerUsername}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-mono">ID: {config.id}</span>
                      <Badge variant={config.isActive ? "default" : "secondary"} className={config.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted-foreground"}>
                        {config.isActive ? <><Activity className="w-3 h-3 mr-1" /> Active</> : <><XCircle className="w-3 h-3 mr-1" /> Inactive</>}
                      </Badge>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-white/[0.06] text-white rounded-xl p-1 shadow-2xl">
                    <DropdownMenuItem onClick={() => testConfig(config.id)} className="rounded-lg focus:bg-accent focus:text-accent-foreground focus:text-foreground cursor-pointer py-2.5">
                      <Wifi className="mr-2 h-4 w-4 text-emerald-400" /> Test Connection
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-secondary/50" />
                    <DropdownMenuItem onClick={() => openEditConfig(config)} className="rounded-lg focus:bg-accent focus:text-accent-foreground focus:text-foreground cursor-pointer py-2.5">
                      <Edit className="mr-2 h-4 w-4 text-blue-400" /> Edit Configuration
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => removeConfig(config.id)} className="rounded-lg text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer py-2.5">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Server
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card Details */}
              <div className="space-y-3 mt-auto">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Globe className="h-4 w-4 text-white/40" /> Panel URL</span>
                  <a href={config.panelUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline truncate max-w-[150px] font-medium">
                    {config.panelUrl}
                  </a>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Hash className="h-4 w-4 text-white/40" /> IP Address</span>
                  <span className="text-sm text-white font-mono">{config.serverIp}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Link className="h-4 w-4 text-white/40" /> Nameservers</span>
                  <div className="flex flex-col items-end text-xs text-white/80 font-mono">
                    <span>{config.nameserver1}</span>
                    <span>{config.nameserver2}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {configs.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center rounded-3xl bg-[#111]/40 border border-white/[0.03]">
              <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Server className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No servers configured</h3>
              <p className="text-muted-foreground max-w-sm text-center mb-6">Add a DirectAdmin server to start provisioning hosting.</p>
              <Button onClick={openCreateConfig} className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 border-0">
                <Plus className="h-4 w-4 mr-2" /> Add Your First Server
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Categories Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6 pt-8 border-t border-white/[0.06]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Hosting Categories</h2>
            <Badge variant="outline" className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border-purple-500/20">{categories.length}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const linkedConfig = configs.find(c => c.id === category.configId)
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
                className="group relative overflow-x-auto no-scrollbar rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08] flex flex-col"
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 bg-zinc-900/90 backdrop-blur-md rounded-lg p-1 border border-white/[0.06]">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-white/70 hover:text-white hover:bg-white/10" onClick={() => openEditCategory(category)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-white/70 hover:text-red-400 hover:bg-red-500/10" onClick={() => removeCategory(category.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                    {category.icon ? (
                      <i className={`fas fa-${category.icon} text-lg text-purple-400`} />
                    ) : (
                      <Layers className="h-6 w-6 text-purple-400" />
                    )}
                  </div>
                  <Badge variant={category.isActive ? "default" : "secondary"} className={category.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted-foreground"}>
                    {category.isActive ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</> : <><XCircle className="h-3 w-3 mr-1" /> Hidden</>}
                  </Badge>
                </div>

                <h3 className="font-bold text-white text-lg mb-1 truncate group-hover:text-purple-400 transition-colors">{category.name}</h3>
                <p className="text-xs text-muted-foreground mb-1">Order: {category.displayOrder}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4 flex-1">
                  {category.description || "No description provided"}
                </p>

                <div className="mt-auto pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-white/40" />
                    Server
                  </span>
                  <span className="text-xs font-medium text-white truncate max-w-[120px]">
                    {linkedConfig ? linkedConfig.resellerUsername : <span className="text-muted-foreground">None</span>}
                  </span>
                </div>
              </motion.div>
            )
          })}

          {categories.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center rounded-3xl bg-[#111]/40 border border-white/[0.03]">
              <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No categories found</h3>
              <p className="text-sm text-muted-foreground max-w-sm text-center mb-5">Create a hosting category to organize your packages for customers.</p>
              <Button onClick={openCreateCategory} className="rounded-xl bg-white/5 border-white/[0.08] hover:bg-white/10 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Server Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl bg-zinc-900/95 backdrop-blur-xl border-white/[0.06] text-foreground rounded-3xl shadow-2xl p-0 overflow-x-auto no-scrollbar">
          <div className="p-6 pr-14 border-b border-white/[0.06] bg-white/[0.02]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 min-w-0">
                <Server className="h-6 w-6 shrink-0 text-blue-400" />
                <span className="min-w-0 break-words">{editingConfig ? "Edit Server Configuration" : "Add DirectAdmin Server"}</span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1.5 pr-0">
                Configure your API credentials to connect completely with DirectAdmin.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className="text-foreground/80 font-medium">Reseller Username</Label>
                <Input
                  value={configForm.resellerUsername}
                  onChange={(e) => setConfigForm({ ...configForm, resellerUsername: e.target.value })}
                  className="h-11 bg-white/[0.04] border-white/[0.06] focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 rounded-xl transition-all"
                  placeholder="admin"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-foreground/80 font-medium">Reseller Password / Login Key</Label>
                <Input
                  type="password"
                  value={configForm.resellerPassword}
                  onChange={(e) => setConfigForm({ ...configForm, resellerPassword: e.target.value })}
                  className="h-11 bg-white/[0.04] border-white/[0.06] focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 rounded-xl transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className="text-foreground/80 font-medium">Server IP Address</Label>
                <Input
                  value={configForm.serverIp}
                  onChange={(e) => setConfigForm({ ...configForm, serverIp: e.target.value })}
                  className="h-11 bg-white/[0.04] border-white/[0.06] focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 rounded-xl transition-all font-mono"
                  placeholder="192.168.1.1"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-foreground/80 font-medium">Panel URL</Label>
                <Input
                  value={configForm.panelUrl}
                  onChange={(e) => setConfigForm({ ...configForm, panelUrl: e.target.value })}
                  className="h-11 bg-white/[0.04] border-white/[0.06] focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 rounded-xl transition-all"
                  placeholder="https://server.com:2222"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="space-y-2.5">
                <Label className="text-foreground/80 font-medium text-xs uppercase tracking-wider">Nameserver 1</Label>
                <Input
                  value={configForm.nameserver1}
                  onChange={(e) => setConfigForm({ ...configForm, nameserver1: e.target.value })}
                  className="h-10 bg-white/[0.04] border-white/[0.06] focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 rounded-lg text-sm"
                  placeholder="ns1.example.com"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-foreground/80 font-medium text-xs uppercase tracking-wider">Nameserver 2</Label>
                <Input
                  value={configForm.nameserver2}
                  onChange={(e) => setConfigForm({ ...configForm, nameserver2: e.target.value })}
                  className="h-10 bg-white/[0.04] border-white/[0.06] focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 rounded-lg text-sm"
                  placeholder="ns2.example.com"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-blue-500/5 border border-white/[0.06]">
              <div className="space-y-1">
                <Label className="text-base text-foreground font-semibold">Active Status</Label>
                <p className="text-sm text-muted-foreground">Is this server available for new deployments?</p>
              </div>
              <Switch checked={configForm.isActive} onCheckedChange={(v) => setConfigForm({ ...configForm, isActive: v })} className="data-[state=checked]:bg-blue-500" />
            </div>
          </div>

          <div className="p-6 border-t border-white/[0.06] bg-white/[0.02]">
            <DialogFooter className="gap-3 sm:gap-0">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)} className="rounded-xl border-white/[0.08] hover:bg-white/[0.06] hover:text-foreground h-11 px-6">Cancel</Button>
              <Button onClick={saveConfig} disabled={isPending} className="rounded-xl bg-blue-500 hover:bg-blue-600 text-foreground shadow-lg shadow-blue-500/20 h-11 px-8 font-medium">
                {isPending ? <Activity className="w-5 h-5 animate-spin" /> : editingConfig ? "Save Changes" : "Create Server"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-xl bg-zinc-900/95 backdrop-blur-xl border-white/[0.06] text-foreground rounded-3xl shadow-2xl p-0 overflow-x-auto no-scrollbar">
          <div className="p-6 pr-14 border-b border-white/[0.06] bg-white/[0.02]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 min-w-0">
                <Layers className="h-6 w-6 shrink-0 text-purple-400" />
                <span className="min-w-0 break-words">{editingCategory ? "Edit Category" : "Create Category"}</span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1.5 pr-0">
                Organize your hosting packages effectively to help users find what they need.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2.5">
              <Label className="text-foreground/80 font-medium">Category Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="h-11 bg-white/[0.04] border-white/[0.06] focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10 rounded-xl transition-all"
                placeholder="e.g., Premium Web Hosting"
              />
            </div>

            <div className="space-y-2.5">
              <Label className="text-foreground/80 font-medium">Description</Label>
              <Input
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="h-11 bg-white/[0.04] border-white/[0.06] focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10 rounded-xl transition-all"
                placeholder="Brief description of packages in this category"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className="text-foreground/80 font-medium">Icon Class</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    fa-
                  </div>
                  <Input
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="h-11 pl-9 bg-white/[0.04] border-white/[0.06] focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10 rounded-xl transition-all"
                    placeholder="server"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label className="text-foreground/80 font-medium">Display Priority</Label>
                <Input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: e.target.value })}
                  className="h-11 bg-white/[0.04] border-white/[0.06] focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10 rounded-xl transition-all"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-foreground/80 font-medium">Linked Server Configuration</Label>
              <Select value={categoryForm.configId} onValueChange={(value) => setCategoryForm({ ...categoryForm, configId: value })}>
                <SelectTrigger className="h-11 bg-white/[0.04] border-white/[0.06] focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10 rounded-xl transition-all">
                  <SelectValue placeholder="Select a DirectAdmin server" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/[0.06] rounded-xl">
                  <SelectItem value="none" className="focus:bg-accent focus:text-accent-foreground focus:text-foreground cursor-pointer py-2.5">No Linked Server</SelectItem>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={String(config.id)} className="focus:bg-accent focus:text-accent-foreground focus:text-foreground cursor-pointer py-2.5">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-muted-foreground" />
                        <span>{config.resellerUsername}</span>
                        <span className="text-muted-foreground ml-1">({config.serverIp})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-purple-500/5 border border-white/[0.06]">
              <div className="space-y-1">
                <Label className="text-base text-foreground font-semibold">Visibility Status</Label>
                <p className="text-sm text-muted-foreground">Show this category on the storefront?</p>
              </div>
              <Switch checked={categoryForm.isActive} onCheckedChange={(v) => setCategoryForm({ ...categoryForm, isActive: v })} className="data-[state=checked]:bg-purple-500" />
            </div>
          </div>

          <div className="p-6 border-t border-white/[0.06] bg-white/[0.02]">
            <DialogFooter className="gap-3 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)} className="rounded-xl border-white/[0.08] hover:bg-white/[0.06] hover:text-foreground h-11 px-6">Cancel</Button>
              <Button onClick={saveCategory} disabled={isPending} className="rounded-xl bg-purple-500 hover:bg-purple-600 text-foreground shadow-lg shadow-purple-500/20 h-11 px-8 font-medium">
                {isPending ? <Activity className="w-5 h-5 animate-spin" /> : editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
