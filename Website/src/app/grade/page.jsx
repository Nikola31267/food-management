import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CLASSES = {
  8: ["8а", "8б", "8в"],
  9: ["9а", "9б", "9в"],
  10: ["10а", "10б", "10в"],
  11: ["11а", "11б", "11в"],
  12: ["12а", "12б", "12в", "12г"],
};

export default function DropdownMenuBasic() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Изберете клас</Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {Object.values(CLASSES).map((group, index) => (
          <div key={index}>
            <DropdownMenuGroup>
              {group.map((item) => (
                <DropdownMenuItem key={item}>{item}</DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            {index < Object.values(CLASSES).length - 1 && (
              <DropdownMenuSeparator />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
