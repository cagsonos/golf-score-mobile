
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Edit, Save, X, Users, Plus } from 'lucide-react';
import { Player } from '@/types/golf';
import { useToast } from '@/hooks/use-toast';
import { playersService } from '@/services/golfService';

interface PlayerSetupProps {
  players: Player[];
  onPlayersUpdate: (players: Player[]) => void;
  onContinue: () => void;
}

export default function PlayerSetup({ players, onPlayersUpdate, onContinue }: PlayerSetupProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [handicap, setHandicap] = useState('');
  const [teeColor, setTeeColor] = useState<'blue' | 'white' | 'red'>('blue');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [savedPlayers, setSavedPlayers] = useState<Player[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved players from Supabase on component mount
  useEffect(() => {
    loadSavedPlayers();
  }, []);

  const loadSavedPlayers = async () => {
    try {
      setLoading(true);
      const playersData = await playersService.getAll();
      setSavedPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los jugadores guardados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlayerFromSaved = (savedPlayer: Player) => {
    // Check if player is already added
    if (players.find(p => p.id === savedPlayer.id)) {
      return;
    }
    
    onPlayersUpdate([...players, savedPlayer]);
  };

  const addNewPlayer = async () => {
    if (!firstName || !lastName || !code || !handicap) return;

    try {
      setLoading(true);
      const newPlayer = await playersService.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        code: code.trim(),
        handicap: parseInt(handicap),
        teeColor
      });

      onPlayersUpdate([...players, newPlayer]);
      
      // Update saved players list
      setSavedPlayers([...savedPlayers, newPlayer]);
      
      // Reset form
      setFirstName('');
      setLastName('');
      setCode('');
      setHandicap('');
      setTeeColor('blue');
      setShowCreateForm(false);

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

  const startEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setFirstName(player.firstName);
    setLastName(player.lastName);
    setCode(player.code);
    setHandicap(player.handicap.toString());
    setTeeColor(player.teeColor);
  };

  const saveEditPlayer = () => {
    if (!editingPlayerId || !firstName || !lastName || !code || !handicap) return;

    const updatedPlayers = players.map(player => 
      player.id === editingPlayerId 
        ? {
            ...player,
            firstName,
            lastName,
            code,
            handicap: parseInt(handicap),
            teeColor
          }
        : player
    );

    onPlayersUpdate(updatedPlayers);
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingPlayerId(null);
    setFirstName('');
    setLastName('');
    setCode('');
    setHandicap('');
    setTeeColor('blue');
    setShowCreateForm(false);
  };

  const removePlayer = (playerId: string) => {
    onPlayersUpdate(players.filter(p => p.id !== playerId));
    if (editingPlayerId === playerId) {
      cancelEdit();
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

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-[var(--shadow-card)]">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg">
        <CardTitle className="text-2xl">Configuración de Jugadores</CardTitle>
        <CardDescription className="text-white/90">
          {editingPlayerId ? 'Editando jugador existente' : 'Selecciona jugadores guardados o crea nuevos'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Saved Players Section */}
        {savedPlayers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Jugadores Guardados ({savedPlayers.length})
              </h3>
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedPlayers.map((savedPlayer) => {
                const isAlreadyAdded = players.find(p => p.id === savedPlayer.id);
                return (
                  <Card key={savedPlayer.id} className={`p-3 cursor-pointer transition-colors ${
                    isAlreadyAdded ? 'bg-golf-green/10 border-golf-green' : 'hover:bg-muted'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{savedPlayer.firstName} {savedPlayer.lastName}</span>
                          <Badge className={`text-white text-xs ${getTeeColorBadge(savedPlayer.teeColor)}`}>
                            {savedPlayer.teeColor === 'blue' ? 'A' : 
                             savedPlayer.teeColor === 'white' ? 'B' : 'R'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {savedPlayer.code} | HCP: {savedPlayer.handicap}
                        </p>
                      </div>
                      <Button
                        onClick={() => addPlayerFromSaved(savedPlayer)}
                        disabled={!!isAlreadyAdded || editingPlayerId !== null}
                        size="sm"
                        variant={isAlreadyAdded ? "secondary" : "default"}
                        className={isAlreadyAdded ? "" : "bg-golf-green hover:bg-golf-green/90"}
                      >
                        {isAlreadyAdded ? 'Agregado' : 'Agregar'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Create New Player Form */}
        {(showCreateForm || savedPlayers.length === 0) && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingPlayerId ? 'Editar Jugador' : 'Crear Nuevo Jugador'}
              </h3>
              {savedPlayers.length > 0 && !editingPlayerId && (
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-muted rounded-lg">
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
              <div className="flex items-end gap-2">
                {editingPlayerId ? (
                  <>
                    <Button
                      onClick={saveEditPlayer}
                      className="flex-1 bg-golf-green hover:bg-golf-green/90"
                      disabled={!firstName || !lastName || !code || !handicap}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      size="icon"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={addNewPlayer}
                    className="w-full bg-golf-green hover:bg-golf-green/90"
                    disabled={!firstName || !lastName || !code || !handicap}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear y Agregar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selected Players List */}
        {players.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Jugadores Seleccionados ({players.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player) => (
                <Card key={player.id} className={`p-4 ${editingPlayerId === player.id ? 'ring-2 ring-golf-green' : ''}`}>
                  <div className="flex justify-between items-start">
                     <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{player.firstName} {player.lastName}</h4>
                        <Badge className={`text-white ${getTeeColorBadge(player.teeColor)}`}>
                          {player.teeColor === 'blue' ? 'Azules' : 
                           player.teeColor === 'white' ? 'Blancas' : 'Rojas'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          Código: {player.code}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`handicap-${player.id}`} className="text-sm text-muted-foreground">
                          Handicap:
                        </Label>
                        <Input
                          id={`handicap-${player.id}`}
                          type="number"
                          value={player.handicap}
                          onChange={(e) => {
                            const newHandicap = parseInt(e.target.value) || 0;
                            const updatedPlayers = players.map(p => 
                              p.id === player.id ? { ...p, handicap: newHandicap } : p
                            );
                            onPlayersUpdate(updatedPlayers);
                          }}
                          min="0"
                          max="54"
                          className="w-20 h-8"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePlayer(player.id)}
                        className="text-destructive hover:text-destructive"
                        title="Quitar jugador de esta partida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        {players.length >= 2 && !editingPlayerId && (
          <div className="pt-4 border-t">
            <Button
              onClick={onContinue}
              className="w-full bg-golf-green hover:bg-golf-green/90"
              size="lg"
            >
              Continuar con Registro de Resultados
            </Button>
          </div>
        )}

        {players.length < 2 && !editingPlayerId && (
          <div className="text-center text-muted-foreground">
            Selecciona o crea al menos 2 jugadores para continuar
          </div>
        )}

        {editingPlayerId && (
          <div className="text-center text-muted-foreground">
            Guarda los cambios del jugador antes de continuar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
