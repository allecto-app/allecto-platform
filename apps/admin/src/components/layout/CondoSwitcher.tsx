import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { Doc, Id } from "../../lib/convexGenerated";

interface CondoSwitcherProps {
  condos: Doc<"condos">[];
  selectedCondoId: Id<"condos"> | null;
  onSelectCondo: (condoId: Id<"condos"> | null) => void;
}

export function CondoSwitcher({ condos, selectedCondoId, onSelectCondo }: CondoSwitcherProps) {
  const [open, setOpen] = useState(false);
  const getCondoInitial = (name?: string) => name?.trim().charAt(0).toUpperCase() || "?";
  const selectedCondo = useMemo(
    () => condos.find((condo) => condo._id === selectedCondoId) ?? null,
    [condos, selectedCondoId],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full max-w-[230px] justify-between"
        >
          {selectedCondo ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary">
                <span className="text-primary-foreground text-[10px]">
                  {getCondoInitial(selectedCondo.name)}
                </span>
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="truncate">{selectedCondo.name}</span>
                <span className="text-muted-foreground truncate">
                  {selectedCondo.subdomain}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Select a condo...</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Search condos..." />
          <CommandList>
            <CommandEmpty>No condo found.</CommandEmpty>
            <CommandGroup>
              {condos.map((condo) => (
                <CommandItem
                  key={condo._id}
                  value={`${condo.name} ${condo.subdomain}`}
                  onSelect={() => {
                    onSelectCondo(
                      condo._id === selectedCondo?._id ? null : condo._id,
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCondo?._id === condo._id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary">
                      <span className="text-primary-foreground text-[10px]">
                        {getCondoInitial(condo.name)}
                      </span>
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="truncate">{condo.name}</span>
                      <span className="text-muted-foreground truncate">
                        {condo.subdomain}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
