"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ChangePasswordForm from "./edit-pass"; 
import { IconLock, IconUser } from "@tabler/icons-react"; 

// TIPOS DE UTILIDADE (Assumindo que estão definidos globalmente ou importados)
type UserData = {
    id: string | number;
    email?: string;
    role?: string;
    name?: string;
    avatar?: string | null;
};
type UpdateResp = { success?: boolean; message?: string } & Record<string, unknown>;

function getErrorMessage(err: unknown, fallback = "Ocorreu um erro"): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return fallback;
}
async function readJson<T>(res: Response): Promise<T | null> {
    try { return (await res.json()) as T } catch { return null }
}
function extractApiMessage(body: unknown): string | null {
    const maybe = body as Record<string, unknown>;
    const nested = maybe.error as { message?: string } | undefined;
    if (nested?.message) return nested.message;
    const msg = maybe.message;
    if (typeof msg === "string") return msg;
    return null;
}

type FormMode = 'profile' | 'password';


export default function EditProfileForm({ initialData, onSuccess }: {
    initialData: UserData | null;
    onSuccess: () => void;
}) {
    // 🛑 NOVO ESTADO: Alterna entre formulários
    const [mode, setMode] = React.useState<FormMode>('profile');
    
    // 🛑 ESTADO DO PERFIL
    const [name, setName] = React.useState(initialData?.name || '');
    const [email, setEmail] = React.useState(initialData?.email || '');
    const [saving, setSaving] = React.useState(false);

    // Efeito para atualizar os campos se os dados iniciais mudarem
    React.useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setEmail(initialData.email || '');
        }
    }, [initialData]);


    // ------------------------------------
    // LÓGICA DE EDIÇÃO DE NOME (PATCH)
    // ------------------------------------
    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault();

        if (!initialData?.id) return toast.error("Dados do usuário não carregados.");
        if (!name.trim()) return toast.error("O nome é obrigatório.");

        try {
            setSaving(true);

            // Apenas envia campos que foram alterados (Nome)
            const payload: { name: string; } = { name };
            
            // 🛑 CHAMADA PATCH para a rota de edição do usuário
            // Assumimos que a rota é /api/users/{id}
            const res = await fetch(`/api/users/${initialData.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                redirect: 'manual',
            });

            const body = await readJson<UpdateResp>(res);

            if (!res.ok || body?.success === false) {
                throw new Error(extractApiMessage(body) ?? "Falha ao salvar perfil.");
            }

            toast.success("Perfil atualizado com sucesso!");
            onSuccess(); // Fecha o modal e recarrega os dados na página pai

        } catch (err) {
            toast.error(getErrorMessage(err, "Erro ao salvar."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="flex justify-center gap-2 mb-4 border-b pb-4">
                <Button 
                    variant={mode === 'profile' ? 'default' : 'outline'}
                    onClick={() => setMode('profile')}
                    className="flex-1"
                >
                    <IconUser className="mr-2 size-4" /> Editar Nome
                </Button>
                <Button 
                    variant={mode === 'password' ? 'default' : 'outline'}
                    onClick={() => setMode('password')}
                    className="flex-1"
                >
                    <IconLock className="mr-2 size-4" /> Mudar Senha
                </Button>
            </div>

            {mode === 'profile' && (
                <form onSubmit={handleSaveProfile} className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="name">Nome</Label>
                        <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            disabled={saving}
                        />
                    </div>
                    
                    <div className="grid gap-1.5">
                        <Label htmlFor="email">E-mail</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            disabled={true} // Email não pode ser alterado
                            className="text-muted-foreground"
                        />
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </div>
                </form>
            )}

            {mode === 'password' && (
                <ChangePasswordForm userId={initialData?.id} onSuccess={onSuccess} />
            )}
        </>
    );
}
