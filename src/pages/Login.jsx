import React, { useEffect, useState } from 'react'
import { userAtom } from '../stores/authAtom'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { FiMail, FiLock } from "react-icons/fi"
import './Login.css'

const Login = () => {
    const [user, setUser] = useAtom(userAtom)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (signInError) {
                setError(signInError.message)
                setLoading(false)
                return
            }

            const userData = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || data.user.email
            }

            setUser(userData)
            navigate('/dashboard')

        } catch (err) {
            setError(err.message || 'Error al iniciar sesión')
            setLoading(false)
        }
    }

    return (
        <div className="login-container">

            <div className="login-card">

                <h2>Bienvenido de nuevo</h2>
                <p className="subtitle">Inicia sesión en tu cuenta para continuar</p>

                {error && <p className="error">{error}</p>}

                <form onSubmit={handleLogin}>

                    <label>Correo electrónico</label>

                    <div className="input-group">
                        <FiMail className="input-icon"/>
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <label>Contraseña</label>
                    <div className="input-group">
                        <FiLock className="input-icon"/>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>

                </form>

                <p className="register-text">
                    ¿No tienes cuenta? <a href="/register">Regístrate</a>
                </p>

            </div>

        </div>
    )
}

export default Login