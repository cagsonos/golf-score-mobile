
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GolfCourse } from '@/types/golf';
import { useToast } from '@/hooks/use-toast';
import { golfCoursesService } from '@/services/golfService';

interface CourseManagementProps {
  courses: GolfCourse[];
  onCoursesUpdate: (courses: GolfCourse[]) => void;
  onBack: () => void;
}

export default function CourseManagement({ courses, onCoursesUpdate, onBack }: CourseManagementProps) {
  const { toast } = useToast();
  const [localCourses, setLocalCourses] = useState<GolfCourse[]>(courses);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [parValues, setParValues] = useState<number[]>([4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4]);
  const [blueHandicaps, setBlueHandicaps] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  const [whiteHandicaps, setWhiteHandicaps] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  const [redHandicaps, setRedHandicaps] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  const [loading, setLoading] = useState(false);

  // Sincronizar cambios con el componente padre
  useEffect(() => {
    setLocalCourses(courses);
  }, [courses]);

  const findDuplicateHoles = (handicaps: number[]): Set<number> => {
    const duplicateHoles = new Set<number>();
    const seen = new Map<number, number[]>();

    handicaps.forEach((handicap, index) => {
      if (!seen.has(handicap)) {
        seen.set(handicap, []);
      }
      seen.get(handicap)!.push(index);
    });

    seen.forEach((holes, handicap) => {
      if (holes.length > 1) {
        holes.forEach(holeIndex => duplicateHoles.add(holeIndex));
      }
    });

    return duplicateHoles;
  };

  const blueDuplicateHoles = findDuplicateHoles(blueHandicaps);
  const whiteDuplicateHoles = findDuplicateHoles(whiteHandicaps);
  const redDuplicateHoles = findDuplicateHoles(redHandicaps);

  const validateHandicapsWithDetails = (handicaps: number[], teeColor: string): { isValid: boolean; duplicates: { handicap: number; holes: number[] }[] } => {
    console.log(`Validating ${teeColor} handicaps:`, handicaps);
    
    if (handicaps.length !== 18) {
      console.log('Invalid length:', handicaps.length);
      return { isValid: false, duplicates: [] };
    }

    // Find duplicates
    const duplicates: { handicap: number; holes: number[] }[] = [];
    const seen = new Map<number, number[]>();

    handicaps.forEach((handicap, index) => {
      if (!seen.has(handicap)) {
        seen.set(handicap, []);
      }
      seen.get(handicap)!.push(index + 1); // hole numbers are 1-based
    });

    // Check for duplicates
    seen.forEach((holes, handicap) => {
      if (holes.length > 1) {
        duplicates.push({ handicap, holes });
      }
    });

    // Check if all values 1-18 are present
    const sortedHandicaps = [...handicaps].sort((a, b) => a - b);
    const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const hasAllValues = JSON.stringify(sortedHandicaps) === JSON.stringify(expected);

    console.log(`${teeColor} validation result:`, { hasAllValues, duplicates });
    
    return { isValid: hasAllValues && duplicates.length === 0, duplicates };
  };

  const resetForm = () => {
    setNewCourseName('');
    setParValues([4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4]);
    setBlueHandicaps([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    setWhiteHandicaps([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    setRedHandicaps([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  };

  const loadCourseForEdit = (course: GolfCourse) => {
    console.log('Loading course for edit:', course);
    setNewCourseName(course.name);
    setParValues([...course.par]);
    setBlueHandicaps([...course.handicaps.blue]);
    setWhiteHandicaps([...course.handicaps.white]);
    setRedHandicaps([...course.handicaps.red]);
    setEditingCourse(course.id);
    setIsCreating(false);
    console.log('Course loaded - Par values:', course.par);
    console.log('Course loaded - Blue handicaps:', course.handicaps.blue);
  };

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del campo",
        variant: "destructive"
      });
      return;
    }

    // Validate handicaps with detailed error messages
    const blueValidation = validateHandicapsWithDetails(blueHandicaps, 'azul');
    const whiteValidation = validateHandicapsWithDetails(whiteHandicaps, 'blanco');
    const redValidation = validateHandicapsWithDetails(redHandicaps, 'rojo');

    if (!blueValidation.isValid) {
      let errorMessage = "Error en ventajas de marcas azules: ";
      if (blueValidation.duplicates.length > 0) {
        const duplicateMessages = blueValidation.duplicates.map(d => 
          `Ventaja ${d.handicap} repetida en hoyos ${d.holes.join(', ')}`
        );
        errorMessage += duplicateMessages.join('; ');
      } else {
        errorMessage += "deben ser números del 1 al 18 sin repetir";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    if (!whiteValidation.isValid) {
      let errorMessage = "Error en ventajas de marcas blancas: ";
      if (whiteValidation.duplicates.length > 0) {
        const duplicateMessages = whiteValidation.duplicates.map(d => 
          `Ventaja ${d.handicap} repetida en hoyos ${d.holes.join(', ')}`
        );
        errorMessage += duplicateMessages.join('; ');
      } else {
        errorMessage += "deben ser números del 1 al 18 sin repetir";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    if (!redValidation.isValid) {
      let errorMessage = "Error en ventajas de marcas rojas: ";
      if (redValidation.duplicates.length > 0) {
        const duplicateMessages = redValidation.duplicates.map(d => 
          `Ventaja ${d.handicap} repetida en hoyos ${d.holes.join(', ')}`
        );
        errorMessage += duplicateMessages.join('; ');
      } else {
        errorMessage += "deben ser números del 1 al 18 sin repetir";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const newCourse = await golfCoursesService.create({
        name: newCourseName.trim(),
        holes: 18,
        par: [...parValues],
        handicaps: {
          blue: [...blueHandicaps],
          white: [...whiteHandicaps],
          red: [...redHandicaps]
        }
      });

      const updatedCourses = [...localCourses, newCourse];
      setLocalCourses(updatedCourses);
      onCoursesUpdate(updatedCourses);
      resetForm();
      setIsCreating(false);

      toast({
        title: "Campo creado",
        description: `Campo "${newCourseName}" creado exitosamente`
      });
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Error al crear el campo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!newCourseName.trim() || !editingCourse) return;

    // Validate handicaps with detailed error messages
    const blueValidation = validateHandicapsWithDetails(blueHandicaps, 'azul');
    const whiteValidation = validateHandicapsWithDetails(whiteHandicaps, 'blanco');
    const redValidation = validateHandicapsWithDetails(redHandicaps, 'rojo');

    if (!blueValidation.isValid) {
      let errorMessage = "Error en ventajas de marcas azules: ";
      if (blueValidation.duplicates.length > 0) {
        const duplicateMessages = blueValidation.duplicates.map(d => 
          `Ventaja ${d.handicap} repetida en hoyos ${d.holes.join(', ')}`
        );
        errorMessage += duplicateMessages.join('; ');
      } else {
        errorMessage += "deben ser números del 1 al 18 sin repetir";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    if (!whiteValidation.isValid) {
      let errorMessage = "Error en ventajas de marcas blancas: ";
      if (whiteValidation.duplicates.length > 0) {
        const duplicateMessages = whiteValidation.duplicates.map(d => 
          `Ventaja ${d.handicap} repetida en hoyos ${d.holes.join(', ')}`
        );
        errorMessage += duplicateMessages.join('; ');
      } else {
        errorMessage += "deben ser números del 1 al 18 sin repetir";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    if (!redValidation.isValid) {
      let errorMessage = "Error en ventajas de marcas rojas: ";
      if (redValidation.duplicates.length > 0) {
        const duplicateMessages = redValidation.duplicates.map(d => 
          `Ventaja ${d.handicap} repetida en hoyos ${d.holes.join(', ')}`
        );
        errorMessage += duplicateMessages.join('; ');
      } else {
        errorMessage += "deben ser números del 1 al 18 sin repetir";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const updatedCourse = await golfCoursesService.update(editingCourse, {
        name: newCourseName.trim(),
        par: [...parValues],
        handicaps: {
          blue: [...blueHandicaps],
          white: [...whiteHandicaps],
          red: [...redHandicaps]
        }
      });

      const updatedCourses = localCourses.map(course => 
        course.id === editingCourse ? updatedCourse : course
      );
      setLocalCourses(updatedCourses);
      onCoursesUpdate(updatedCourses);
      resetForm();
      setEditingCourse(null);

      toast({
        title: "Campo actualizado",
        description: `Campo "${newCourseName}" actualizado exitosamente`
      });
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el campo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      setLoading(true);
      await golfCoursesService.delete(courseId);
      
      const updatedCourses = localCourses.filter(course => course.id !== courseId);
      setLocalCourses(updatedCourses);
      onCoursesUpdate(updatedCourses);
      
      toast({
        title: "Campo eliminado",
        description: "Campo eliminado exitosamente"
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el campo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateParValue = (holeIndex: number, par: number) => {
    const newPar = [...parValues];
    newPar[holeIndex] = par;
    setParValues(newPar);
  };

  const updateHandicap = (holeIndex: number, handicap: number, teeColor: 'blue' | 'white' | 'red') => {
    if (teeColor === 'blue') {
      const newHandicaps = [...blueHandicaps];
      newHandicaps[holeIndex] = handicap;
      setBlueHandicaps(newHandicaps);
    } else if (teeColor === 'white') {
      const newHandicaps = [...whiteHandicaps];
      newHandicaps[holeIndex] = handicap;
      setWhiteHandicaps(newHandicaps);
    } else {
      const newHandicaps = [...redHandicaps];
      newHandicaps[holeIndex] = handicap;
      setRedHandicaps(newHandicaps);
    }
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingCourse(null);
    resetForm();
  };

  const startCreating = () => {
    resetForm();
    setEditingCourse(null);
    setIsCreating(true);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-[var(--shadow-card)]">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Administración de Campos</CardTitle>
            <CardDescription className="text-white/90">
              Crear, editar y eliminar campos de golf
            </CardDescription>
          </div>
          <Button variant="secondary" onClick={onBack}>
            Volver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Course List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Campos Existentes ({localCourses.length})</h3>
            <Button
              onClick={startCreating}
              className="bg-golf-green hover:bg-golf-green/90"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Campo
            </Button>
          </div>

          <div className="grid gap-4">
            {localCourses.map(course => (
              <Card key={course.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{course.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {course.holes} hoyos • Par {course.par.reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCourseForEdit(course)}
                      disabled={loading}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Course Form */}
        {(isCreating || editingCourse) && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingCourse ? 'Editar Campo' : 'Crear Nuevo Campo'}
              </h3>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>

            <div>
              <Label>Nombre del Campo</Label>
              <Input
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Ej: Club Campestre de la Sabana"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Configuración por Hoyo</Label>
              
              {/* Headers */}
              <div className="grid grid-cols-2 gap-6 text-xs text-muted-foreground mb-2">
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  <span></span>
                  <span className="text-center text-xs">Par</span>
                  <span className="text-center text-xs">Azul</span>
                  <span className="text-center text-xs">Blanco</span>
                  <span className="text-center text-xs">Rojo</span>
                </div>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  <span></span>
                  <span className="text-center text-xs">Par</span>
                  <span className="text-center text-xs">Azul</span>
                  <span className="text-center text-xs">Blanco</span>
                  <span className="text-center text-xs">Rojo</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front Nine */}
                <div>
                  <h3 className="font-medium mb-3 text-golf-green text-sm">Primera Ronda (Hoyos 1-9)</h3>
                  <div className="space-y-2">
                    {Array.from({length: 9}, (_, i) => (
                      <div key={i} className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
                        <Label className="text-xs font-medium">H{i + 1}</Label>
                        
                        <Select value={parValues[i].toString()} onValueChange={(value) => updateParValue(i, parseInt(value))}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={blueHandicaps[i].toString()} onValueChange={(value) => updateHandicap(i, parseInt(value), 'blue')}>
                          <SelectTrigger className={cn("h-7 text-xs", blueDuplicateHoles.has(i) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={whiteHandicaps[i].toString()} onValueChange={(value) => updateHandicap(i, parseInt(value), 'white')}>
                          <SelectTrigger className={cn("h-7 text-xs", whiteDuplicateHoles.has(i) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={redHandicaps[i].toString()} onValueChange={(value) => updateHandicap(i, parseInt(value), 'red')}>
                          <SelectTrigger className={cn("h-7 text-xs", redDuplicateHoles.has(i) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Back Nine */}
                <div>
                  <h3 className="font-medium mb-3 text-golf-green text-sm">Segunda Ronda (Hoyos 10-18)</h3>
                  <div className="space-y-2">
                    {Array.from({length: 9}, (_, i) => (
                      <div key={i + 9} className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
                        <Label className="text-xs font-medium">H{i + 10}</Label>
                        
                        <Select value={parValues[i + 9].toString()} onValueChange={(value) => updateParValue(i + 9, parseInt(value))}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={blueHandicaps[i + 9].toString()} onValueChange={(value) => updateHandicap(i + 9, parseInt(value), 'blue')}>
                          <SelectTrigger className={cn("h-7 text-xs", blueDuplicateHoles.has(i + 9) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={whiteHandicaps[i + 9].toString()} onValueChange={(value) => updateHandicap(i + 9, parseInt(value), 'white')}>
                          <SelectTrigger className={cn("h-7 text-xs", whiteDuplicateHoles.has(i + 9) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={redHandicaps[i + 9].toString()} onValueChange={(value) => updateHandicap(i + 9, parseInt(value), 'red')}>
                          <SelectTrigger className={cn("h-7 text-xs", redDuplicateHoles.has(i + 9) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}
                className="flex-1 bg-golf-green hover:bg-golf-green/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCourse ? 'Actualizar Campo' : 'Crear Campo'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
