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

                <p className="login-link">
                    ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>

            </div>

        </div>
    )
}

export default Register