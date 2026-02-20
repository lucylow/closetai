import { hexContrastColor } from "../../utils/colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SkinAnalysisResultView({ result }: any) {
  if (!result) return null;
  const { skin_color_hex, undertone, skin_type, palette } = result;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Skin Tone</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full border border-black/10" 
                style={{ backgroundColor: skin_color_hex }}
              />
              <span className="font-semibold uppercase">{skin_color_hex}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Undertone</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Badge variant="secondary" className="capitalize text-base px-4 py-1">
              {undertone}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Recommended Palette</h4>
        <div className="flex flex-wrap gap-2">
          {palette?.map((color: string, i: number) => (
            <div
              key={i}
              className="w-16 h-12 rounded-xl shadow-sm border border-black/5 flex items-center justify-center"
              style={{ backgroundColor: color, color: hexContrastColor(color) }}
            >
              <span className="text-[10px] font-bold opacity-50 uppercase">{color}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
