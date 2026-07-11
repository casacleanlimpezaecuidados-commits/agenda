import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  Building2,
  Shield,
  Star
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark relative overflow-hidden items-center justify-center">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-light rounded-full blur-3xl opacity-20 animate-pulse-soft" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-20 animate-pulse-soft" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
        </div>

        <div className="relative z-10 text-center px-12 animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-light to-primary-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
              <Sparkles className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4">
            Casa & Clean
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Gestão Operacional Inteligente
          </p>
          
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm">
              <Building2 className="w-6 h-6 text-light mx-auto mb-2" />
              <p className="text-xs text-gray-400">Clientes</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm">
              <Shield className="w-6 h-6 text-light mx-auto mb-2" />
              <p className="text-xs text-gray-400">Premium</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm">
              <Star className="w-6 h-6 text-light mx-auto mb-2" />
              <p className="text-xs text-gray-400">Online 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-light rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Casa & Clean</h2>
          </div>

          <div className="card-premium p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Bem-vindo de volta!
              </h2>
              <p className="text-gray-500">
                Faça login para acessar o sistema
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-danger-light border border-danger/20 rounded-xl flex items-center gap-3 animate-scale-in">
                <div className="w-1 h-1 bg-danger rounded-full" />
                <p className="text-sm text-danger font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              <div>
                <label className="label-premium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-premium pl-10"
                    placeholder="seu@email.com"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-premium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Entrar
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}