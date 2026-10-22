import { useState } from 'react';
import * as Yup from 'yup';
import './login.css';

import { api } from '../../services/api';

const loginSchema = Yup.object({
    email: Yup.string()
        .trim()
        .email('Informe um e-mail válido.')
        .required('Informe seu e-mail.'),
    password: Yup.string()
        .required('Informe sua senha.'),
});

const signupSchema = Yup.object({
    name: Yup.string()
        .trim()
        .required('Informe seu nome.'),
    email: Yup.string()
        .trim()
        .email('Informe um e-mail válido.')
        .required('Informe seu e-mail.'),
    password: Yup.string()
        .min(6, 'A senha deve ter pelo menos 6 caracteres.')
        .required('Informe sua senha.'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'As senhas não conferem.')
        .required('Confirme sua senha.'),
});

const viewContent = {
    login: {
        eyebrow: 'BEM-VINDO DE VOLTA',
        title: 'Entre na sua conta',
        description: 'Acesse seu espaço e continue cuidando dos seus negócios.',
    },
    signup: {
        eyebrow: 'COMECE AGORA',
        title: 'Crie sua conta',
        description: 'Organize seus imóveis e clientes em um só lugar.',
    },
    recovery: {
        eyebrow: 'RECUPERAÇÃO DE ACESSO',
        title: 'Esqueceu sua senha?',
        description: 'Informe seu e-mail e você poderá redefinir sua senha.',
    },
    reset: {
        eyebrow: 'NOVA SENHA',
        title: 'Defina uma nova senha',
        description: 'Escolha uma senha nova para voltar a acessar sua conta.',
    },
}

function getApiErrorMessage(error) {
    const responseData = error.response?.data
    const responseMessage = responseData?.error ?? responseData?.message

    if (Array.isArray(responseMessage)) {
        return responseMessage.join(' ')
    }

    if (typeof responseMessage === 'string') {
        return responseMessage
    }

    if (error.request) {
        return 'Não foi possível conectar ao servidor. Tente novamente em instantes.'
    }

    return error.message || 'Não foi possível concluir a solicitação.'
}

export default function Login() {
    const [resetLink] = useState(() => {
        const searchParams = new URLSearchParams(window.location.search)

        return {
            email: searchParams.get('email') ?? '',
            token: searchParams.get('token') ?? '',
        }
    })
    const [view, setView] = useState(() => resetLink.token ? 'reset' : 'login')
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [notice, setNotice] = useState(null)
    const content = viewContent[view]

    function changeView(nextView) {
        setView(nextView)
        setNotice(null)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setNotice(null)

        const formData = new FormData(event.currentTarget)
        const name = String(formData.get('name') ?? '').trim()
        const email = String(formData.get('email') ?? '').trim()
        const password = String(formData.get('password') ?? '')
        const confirmPassword = String(formData.get('confirmPassword') ?? '')

        try {
            const credentials = view === 'login'
                ? await loginSchema.validate({ email, password }, { abortEarly: false })
                : view === 'signup'
                    ? await signupSchema.validate({ name, email, password, confirmPassword }, { abortEarly: false })
                    : null

            setIsSubmitting(true)

            if (view === 'login') {
                const response = await api.post('/sessions', credentials)
                const { token } = response.data

                if (typeof token !== 'string' || !token) {
                    throw new Error('O servidor não retornou um token de acesso válido.')
                }

                const remember = formData.get('remember') === 'on'
                window.localStorage.removeItem('token')
                window.sessionStorage.removeItem('token')
                window[remember ? 'localStorage' : 'sessionStorage'].setItem('token', token)

                window.location.assign('/admin')
            } else if (view === 'signup') {
                await api.post('/users', {
                    name: credentials.name,
                    email: credentials.email,
                    password: credentials.password,
                })

                setView('login')
                setNotice({ type: 'success', message: 'Cadastro realizado. Entre com seu e-mail e senha.' })
            } else if (view === 'recovery') {
                await api.post('/password/forgot', { email })
                setNotice({
                    type: 'success',
                    message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
                })
            } else {
                await api.post('/password/reset', {
                    email,
                    token: resetLink.token,
                    password,
                })

                window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`)
                setView('login')
                setNotice({ type: 'success', message: 'Senha atualizada. Entre com sua nova senha.' })
            }
        } catch (error) {
            const message = error instanceof Yup.ValidationError
                ? [...new Set(error.errors)].join(' ')
                : getApiErrorMessage(error)

            setNotice({ type: 'error', message })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="login-page">
            <section className="login-showcase" aria-label="Sobre o CRM imobiliário">
                <a className="brand" href="/" aria-label="Imobly, página inicial">
                    <span className="brand-mark" aria-hidden="true">
                        <svg viewBox="0 0 32 32" fill="none">
                            <path d="M4 14.2 16 4l12 10.2v13.3H4V14.2Z" />
                            <path d="M12 27.5V17h8v10.5M4 14.2h24" />
                        </svg>
                    </span>
                    <span>imobly<span className="brand-dot">.</span></span>
                </a>

                <div className="showcase-copy">
                    <span className="showcase-label">SEU NEGÓCIO, EM BOAS MÃOS</span>
                    <h1>Boas conexões<br />constroem grandes<br /><span>negócios.</span></h1>
                    <p>Seu próximo passo no mercado imobiliário começa por aqui.</p>
                </div>

                <div className="showcase-footer">
                    <span className="showcase-line" aria-hidden="true" />
                    <span>Gestão imobiliária mais simples.</span>
                </div>
                <div className="showcase-shape showcase-shape-one" aria-hidden="true" />
                <div className="showcase-shape showcase-shape-two" aria-hidden="true" />
            </section>

            <section className="login-panel">
                <div className="mobile-brand">
                    <a className="brand" href="/" aria-label="Imobly, página inicial">
                        <span className="brand-mark" aria-hidden="true">
                            <svg viewBox="0 0 32 32" fill="none">
                                <path d="M4 14.2 16 4l12 10.2v13.3H4V14.2Z" />
                                <path d="M12 27.5V17h8v10.5M4 14.2h24" />
                            </svg>
                        </span>
                        <span>imobly<span className="brand-dot">.</span></span>
                    </a>
                </div>

                <div className="form-wrap">
                    <div className="form-heading">
                        <span className="form-eyebrow">{content.eyebrow}</span>
                        <h2>{content.title}</h2>
                        <p>{content.description}</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {view === 'signup' && (
                            <label className="field">
                                <span>Nome completo</span>
                                <input
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Como podemos te chamar?"
                                    required
                                    type="text"
                                />
                            </label>
                        )}

                        <label className="field">
                            <span>E-mail</span>
                            <input
                                autoComplete="email"
                                defaultValue={view === 'reset' ? resetLink.email : undefined}
                                name="email"
                                placeholder="voce@exemplo.com"
                                required
                                type="email"
                            />
                        </label>

                        {view === 'reset' && (
                            <input name="token" type="hidden" value={resetLink.token} />
                        )}

                        {view !== 'recovery' && (
                            <label className="field">
                                <span>{view === 'reset' ? 'Nova senha' : 'Senha'}</span>
                                <span className="password-input">
                                    <input
                                        autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                                        minLength={view === 'login' ? undefined : 6}
                                        name="password"
                                        placeholder={view === 'login' ? 'Sua senha' : 'Pelo menos 6 caracteres'}
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                    />
                                    <button
                                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        type="button"
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                                                <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a14.2 14.2 0 0 1-3 3.8M6.2 6.3C3.9 8 3 12 3 12s3.5 7 9 7a9 9 0 0 0 3-.5" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
                                                <circle cx="12" cy="12" r="2.5" />
                                            </svg>
                                        )}
                                    </button>
                                </span>
                            </label>
                        )}

                        {view === 'signup' && (
                            <label className="field">
                                <span>Confirmar senha</span>
                                <input
                                    autoComplete="new-password"
                                    minLength={6}
                                    name="confirmPassword"
                                    placeholder="Digite sua senha novamente"
                                    required
                                    type="password"
                                />
                            </label>
                        )}

                        {view === 'login' && (
                            <div className="form-options">
                                <label className="remember-option">
                                    <input name="remember" type="checkbox" />
                                    <span>Manter conectado</span>
                                </label>
                                <button className="text-link" onClick={() => changeView('recovery')} type="button">
                                    Esqueci minha senha
                                </button>
                            </div>
                        )}

                        <button className="submit-button" disabled={isSubmitting} type="submit">
                            {isSubmitting
                                ? 'Aguarde...'
                                : view === 'login'
                                    ? 'Entrar na minha conta'
                                    : view === 'signup'
                                        ? 'Criar minha conta'
                                        : view === 'reset'
                                            ? 'Atualizar senha'
                                            : 'Enviar instruções'}
                            <span aria-hidden="true">→</span>
                        </button>

                        {notice && (
                            <p className="form-notice" data-type={notice.type} role={notice.type === 'error' ? 'alert' : 'status'}>
                                {notice.message}
                            </p>
                        )}
                    </form>

                    <div className="form-divider"><span>ou</span></div>

                    {view === 'login' ? (
                        <p className="switch-view">
                            Ainda não tem acesso?{' '}
                            <button className="text-link" onClick={() => changeView('signup')} type="button">
                                Faça seu cadastro
                            </button>
                        </p>
                    ) : (
                        <p className="switch-view">
                            {view === 'signup' ? 'Já tem uma conta?' : view === 'recovery' ? 'Lembrou sua senha?' : 'Já atualizou sua senha?'}{' '}
                            <button className="text-link" onClick={() => changeView('login')} type="button">
                                Voltar para o login
                            </button>
                        </p>
                    )}

                    <p className="panel-footer">© 2026 Imobly. Feito para aproximar pessoas e imóveis.</p>
                </div>
            </section>
        </main>
    )
}
