import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Edit, Save, X } from 'lucide-react';
import { Player, GameSession } from '@/types/golf';
import { useToast } from '@/hooks/use-toast';
import { playersService } from '@/services/golfService';
import PlayerHistory from './PlayerHistory';

interface PlayerManagementProps {
  onBack: () => void;
  onLoadSession?: (session: GameSession) => void;
}

export default function PlayerManagement({ onBack, onLoadSession }: PlayerManagementProps) {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Player | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [handicap, setHandicap] = useState('');
  const [teeColor, setTeeColor] = useState<'blue' | 'white' | 'red'>('blue');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const playersData = await playersService.getAll();
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los jugadores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setCode('');
    setHandicap('');
    setTeeColor('blue');
  };

  const handleCreatePlayer = async () => {
    if (!firstName.trim() || !lastName.trim() || !code.trim() || !handicap) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const newPlayer = await playersService.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        code: code.trim(),
        handicap: parseInt(handicap),
        teeColor
      });

      setPlayers([...players, newPlayer]);
      resetForm();
      setIsCreating(false);

      toast({
        title: "Jugador creado",
        description: `Jugador "${firstName} ${lastName}" creado exitosamente`
      });
    } catch (error) {
      console.error('Error creating player:', error);
      toast({
        title: "Error",
        description: "Error al crear el jugador",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerForEdit = (player: Player) => {
    setFirstName(player.firstName);
    setLastName(player.lastName);
    setCode(player.code);
    setHandicap(player.handicap.toString());
    setTeeColor(player.teeColor);
    setEditingPlayer(player.id);
  };

  const handleUpdatePlayer = async () => {
    if (!firstName.trim() || !lastName.trim() || !code.trim() || !handicap || !editingPlayer) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const updatedPlayer = await playersService.update(editingPlayer, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        code: code.trim(),
        handicap: parseInt(handicap),
        teeColor
      });

      const updatedPlayers = players.map(player => 
        player.id === editingPlayer ? updatedPlayer : player
      );

      setPlayers(updatedPlayers);
      resetForm();
      setEditingPlayer(null);

      toast({
        title: "Jugador actualizado",
        description: `Jugador "${firstName} ${lastName}" actualizado exitosamente`
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el jugador",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      setLoading(true);
      await playersService.delete(playerId);
      const updatedPlayers = players.filter(player => player.id !== playerId);
      setPlayers(updatedPlayers);
      
      toast({
        title: "Jugador eliminado",
        description: "Jugador eliminado exitosamente"
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el jugador",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingPlayer(null);
    resetForm();
  };

  const handlePlayerClick = (player: Player) => {
    // Si no está editando ni creando, mostrar historial
    if (!editingPlayer && !isCreating) {
      setViewingHistory(player);
    }
  };

  const handleLoadSession = (session: GameSession) => {
    if (onLoadSession) {
      onLoadSession(session);
    }
  };

  const getTeeColorBadge = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      white: 'bg-gray-500',
      red: 'bg-red-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  // Si está viendo el historial de un jugador, mostrar solo ese componente
  if (viewingHistory) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <PlayerHistory
          player={viewingHistory}
          onClose={() => setViewingHistory(null)}
          onLoadSession={handleLoadSession}
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-[var(--shadow-card)]">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Administración de Jugadores</CardTitle>
            <CardDescription className="text-white/90">
              Crear, editar y eliminar jugadores registrados. Haz clic en un jugador para ver su historial.
            </CardDescription>
          </div>
          <Button variant="secondary" onClick={onBack}>
            Volver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Players List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Jugadores Registrados ({players.length})</h3>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-golf-green hover:bg-golf-green/90"
              disabled={loading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Nuevo Jugador
            </Button>
          </div>

          <div className="grid gap-4">
            {players.map(player => (
              <Card 
                key={player.id} 
                className="p-4 cursor-pointer hover:border-golf-green/40 transition-colors"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{player.firstName} {player.lastName}</h4>
                        <Badge className={`text-white ${getTeeColorBadge(player.teeColor)}`}>
                          {player.teeColor === 'blue' ? 'Azules' : 
                           player.teeColor === 'white' ? 'Blancas' : 'Rojas'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Código: {player.code} | Handicap: {player.handicap}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPlayerForEdit(player)}
                      disabled={loading}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePlayer(player.id)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {players.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-8">
                No hay jugadores registrados
              </div>
            )}
            {loading && (
              <div className="text-center text-muted-foreground py-8">
                Cargando jugadores...
              </div>
            )}
          </div>
        </div>

        {/* Player Form */}
        {(isCreating || editingPlayer) && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingPlayer ? 'Editar Jugador' : 'Crear Nuevo Jugador'}
              </h3>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Carlos"
                />
              </div>
              <div>
                <Label>Apellido</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Gutiérrez"
                />
              </div>
              <div>
                <Label>Código</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="CG001"
                />
              </div>
              <div>
                <Label>Handicap</Label>
                <Input
                  type="number"
                  value={handicap}
                  onChange={(e) => setHandicap(e.target.value)}
                  placeholder="9"
                  min="0"
                  max="54"
                />
              </div>
              <div>
                <Label>Marcas</Label>
                <Select value={teeColor} onValueChange={(value: 'blue' | 'white' | 'red') => setTeeColor(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Azules</SelectItem>
                    <SelectItem value="white">Blancas</SelectItem>
                    <SelectItem value="red">Rojas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}
                className="flex-1 bg-golf-green hover:bg-golf-green/90"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingPlayer ? 'Actualizar Jugador' : 'Crear Jugador'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}