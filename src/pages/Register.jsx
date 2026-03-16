import React from 'react'
import { userAtom } from '../stores/authAtom'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { User, Mail, Lock } from "lucide-react"
import './Register.css'

const Register = () => {
    const [user, setUser] = useAtom(userAtom)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    if (user) {
        navigate('/dashboard')
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name }
                }
            })

            if (signUpError) {
                setError(signUpError.message)
                setLoading(false)
                return
            }

            setUser({
                id: data.user.id,
                email: data.user.email,
                name
            })

            navigate('/dashboard')

        } catch (err) {
            setError(err.message || 'Error al registrarse')
            setLoading(false)
        }
    }

    return (
        <div className="register-container">

            <div className="register-card">

                <h2>Crea tu cuenta</h2>
                <p className="register-subtitle">
                    Comienza a crear encuestas en minutos
                </p>

                {error && <p className="register-error">{error}</p>}

                <form onSubmit={handleRegister}>

                    <label>Nombre completo</label>
                    <div className="input-group">
                        <User size={18} className="input-icon"/>
                        <input
                            type="text"
                            placeholder="Tu nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <label>Correo electrónico</label>
                    <div className="input-group">
                        <Mail size={18} className="input-icon"/>
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
                        <Lock size={18} className="input-icon"/>
                        <input
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>

                </form>

                <div className="register-divider">
                    <span>O REGÍSTRATE CON</span>
                </div>

                <button className="google-register">

                    <svg 
                        className="google-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                    >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.32 1.53 7.77 2.82l5.73-5.73C33.86 3.5 29.3 1.5 24 1.5 14.64 1.5 6.73 7.48 3.46 15.96l6.84 5.32C12.08 14.13 17.56 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.1 24.5c0-1.63-.15-3.2-.43-4.7H24v9h12.4c-.54 2.9-2.18 5.36-4.66 7.02l7.18 5.59C43.98 37.07 46.1 31.32 46.1 24.5z"/>
                        <path fill="#FBBC05" d="M10.3 28.68A14.5 14.5 0 0 1 9.5 24c0-1.63.28-3.2.8-4.68l-6.84-5.32A22.48 22.48 0 0 0 1.5 24c0 3.64.87 7.07 2.42 10.04l6.38-5.36z"/>
                        <path fill="#34A853" d="M24 46.5c6.48 0 11.93-2.14 15.9-5.82l-7.18-5.59c-2 1.35-4.56 2.16-8.72 2.16-6.44 0-11.92-4.63-13.7-10.78l-6.38 5.36C6.73 40.52 14.64 46.5 24 46.5z"/>
                    </svg>

                    Google
                </button>

                <p className="login-link">
                    ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>

            </div>

        </div>
    )
}

export default Register