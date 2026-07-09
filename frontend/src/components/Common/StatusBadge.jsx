import { 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  XCircle, 
  AlertTriangle,
  UserX 
} from 'lucide-react';

const statusConfig = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    className: 'badge-warning',
  },
  confirmado: {
    label: 'Confirmado',
    icon: CheckCircle2,
    className: 'badge-success',
  },
  em_andamento: {
    label: 'Em Andamento',
    icon: PlayCircle,
    className: 'badge-info',
  },
  concluido: {
    label: 'Concluído',
    icon: CheckCircle2,
    className: 'badge-success',
  },
  concluido_ressalva: {
    label: 'C/ Ressalva',
    icon: AlertTriangle,
    className: 'badge-warning',
  },
  cancelado_cliente: {
    label: 'Cancelado',
    icon: XCircle,
    className: 'badge-danger',
  },
  funcionario_faltou: {
    label: 'Faltou',
    icon: UserX,
    className: 'badge-danger',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || statusConfig.pendente;
  const Icon = config.icon;

  return (
    <span className={`${config.className} ${size === 'lg' ? 'px-4 py-1.5 text-sm' : ''}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}