import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { GolfCourse } from '@/types/golf';
import { useToast } from '@/hooks/use-toast';
import { golfCoursesService } from '@/services/golfService';

interface CourseSetupProps {
  existingCourses: GolfCourse[];
  onCourseSelected: (course: GolfCourse, date: Date) => void;
}

const defaultPar = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4];

export default function CourseSetup({ existingCourses, onCourseSelected }: CourseSetupProps) {
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [date, setDate] = useState<Date>();
  const [parValues, setParValues] = useState<number[]>(defaultPar);
  const [blueHandicaps, setBlueHandicaps] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  const [whiteHandicaps, setWhiteHandicaps] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  const [redHandicaps, setRedHandicaps] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);

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

  const handleCreateCourse = async () => {
    console.log('Attempting to create course...');
    console.log('Course name:', newCourseName);
    console.log('Date:', date);
    console.log('Par values:', parValues);
    console.log('Blue handicaps:', blueHandicaps);
    console.log('White handicaps:', whiteHandicaps);
    console.log('Red handicaps:', redHandicaps);

    if (!newCourseName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del campo",
        variant: "destructive"
      });
      return;
    }

    if (!date) {
      toast({
        title: "Error", 
        description: "Por favor selecciona una fecha",
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
      const newCourse = await golfCoursesService.create({
        name: newCourseName.trim(),
        holes: 18,
        par: parValues,
        handicaps: {
          blue: blueHandicaps,
          white: whiteHandicaps,
          red: redHandicaps
        }
      });

      console.log('Created course:', newCourse);

      toast({
        title: "Campo creado",
        description: `Campo "${newCourseName}" creado exitosamente`
      });

      console.log('CourseSetup - New course date:', date);
      console.log('CourseSetup - New course date toString():', date.toString());
      console.log('CourseSetup - New course date components:', {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
      });
      
      onCourseSelected(newCourse, date);
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Error al crear el campo",
        variant: "destructive"
      });
    }
  };

  const handleSelectExisting = () => {
    if (!selectedCourse || !date) {
      toast({
        title: "Error",
        description: "Por favor selecciona un campo y una fecha",
        variant: "destructive"
      });
      return;
    }
    
    console.log('CourseSetup - Selected date:', date);
    console.log('CourseSetup - Date toString():', date.toString());
    console.log('CourseSetup - Date components:', {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate()
    });
    
    const course = existingCourses.find(c => c.id === selectedCourse);
    if (course) {
      onCourseSelected(course, date);
    }
  };

  const updateParValue = (holeIndex: number, par: number) => {
    const newPar = [...parValues];
    newPar[holeIndex] = par;
    setParValues(newPar);
  };

  const updateHandicap = (holeIndex: number, handicap: number, teeColor: 'blue' | 'white' | 'red') => {
    console.log(`Updating handicap for hole ${holeIndex + 1}, tee ${teeColor}, handicap ${handicap}`);
    
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

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-[var(--shadow-card)]">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg">
        <CardTitle className="text-2xl">Configuración del Campo</CardTitle>
        <CardDescription className="text-white/90">
          Selecciona un campo existente o crea uno nuevo
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Fecha del Juego</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Course Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Campo de Golf</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar campo existente" />
                </SelectTrigger>
                <SelectContent>
                  {existingCourses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsCreatingNew(true)}
              className="mt-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Campo
            </Button>
          </div>

          {selectedCourse && !isCreatingNew && (
            <Button 
              onClick={handleSelectExisting} 
              className="w-full bg-golf-green hover:bg-golf-green/90"
              disabled={!date}
            >
              Continuar con Campo Seleccionado
            </Button>
          )}
        </div>

        {/* New Course Creation */}
        {isCreatingNew && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label>Nombre del Nuevo Campo</Label>
              <Input
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Ej: Club Campestre de la Sabana"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Configuración por Hoyo</Label>
              
              {/* Headers for the columns */}
              <div className="grid grid-cols-2 gap-6 text-xs text-muted-foreground mb-2">
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  <span></span>
                  <span className="text-center">Par</span>
                  <span className="text-center">Azul</span>
                  <span className="text-center">Blanco</span>
                  <span className="text-center">Rojo</span>
                </div>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  <span></span>
                  <span className="text-center">Par</span>
                  <span className="text-center">Azul</span>
                  <span className="text-center">Blanco</span>
                  <span className="text-center">Rojo</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primera Ronda (Hoyos 1-9) */}
                <div>
                  <h3 className="font-medium mb-3 text-golf-green">Primera Ronda (Hoyos 1-9)</h3>
                  <div className="space-y-3">
                    {Array.from({length: 9}, (_, i) => (
                      <div key={i} className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
                        <Label className="text-sm font-medium">Hoyo {i + 1}</Label>
                        
                        <Select value={parValues[i].toString()} onValueChange={(value) => updateParValue(i, parseInt(value))}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">Par 3</SelectItem>
                            <SelectItem value="4">Par 4</SelectItem>
                            <SelectItem value="5">Par 5</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={blueHandicaps[i].toString()} onValueChange={(value) => updateHandicap(i, parseInt(value), 'blue')}>
                          <SelectTrigger className={cn("h-8", blueDuplicateHoles.has(i) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={whiteHandicaps[i].toString()} onValueChange={(value) => updateHandicap(i, parseInt(value), 'white')}>
                          <SelectTrigger className={cn("h-8", whiteDuplicateHoles.has(i) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={redHandicaps[i].toString()} onValueChange={(value) => updateHandicap(i, parseInt(value), 'red')}>
                          <SelectTrigger className={cn("h-8", redDuplicateHoles.has(i) && "border-destructive bg-destructive/10")}>
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

                {/* Segunda Ronda (Hoyos 10-18) */}
                <div>
                  <h3 className="font-medium mb-3 text-golf-green">Segunda Ronda (Hoyos 10-18)</h3>
                  <div className="space-y-3">
                    {Array.from({length: 9}, (_, i) => (
                      <div key={i + 9} className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
                        <Label className="text-sm font-medium">Hoyo {i + 10}</Label>
                        
                        <Select value={parValues[i + 9].toString()} onValueChange={(value) => updateParValue(i + 9, parseInt(value))}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">Par 3</SelectItem>
                            <SelectItem value="4">Par 4</SelectItem>
                            <SelectItem value="5">Par 5</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={blueHandicaps[i + 9].toString()} onValueChange={(value) => updateHandicap(i + 9, parseInt(value), 'blue')}>
                          <SelectTrigger className={cn("h-8", blueDuplicateHoles.has(i + 9) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={whiteHandicaps[i + 9].toString()} onValueChange={(value) => updateHandicap(i + 9, parseInt(value), 'white')}>
                          <SelectTrigger className={cn("h-8", whiteDuplicateHoles.has(i + 9) && "border-destructive bg-destructive/10")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 18}, (_, j) => j + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={redHandicaps[i + 9].toString()} onValueChange={(value) => updateHandicap(i + 9, parseInt(value), 'red')}>
                          <SelectTrigger className={cn("h-8", redDuplicateHoles.has(i + 9) && "border-destructive bg-destructive/10")}>
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
                onClick={handleCreateCourse}
                className="flex-1 bg-golf-green hover:bg-golf-green/90"
              >
                Crear Campo y Continuar
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreatingNew(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
