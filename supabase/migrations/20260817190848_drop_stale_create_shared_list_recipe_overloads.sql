-- Städar bort två föråldrade överlagringar av create_shared_list_recipe.
--
-- Tre versioner samexisterade: 5, 10 och 11 parametrar. Klienten skickar
-- alltid p_equipment_settings och träffar därför 11-varianten via PostgREST
-- namnmatchning — men varje anrop som utelämnar valfria parametrar blir
-- tvetydigt (42725: "is not unique"). De två äldre saknar dessutom
-- snapshot-skrivningen och equipment_settings.
--
-- Samma fälla som slog till på send_message tidigare: CREATE OR REPLACE med
-- en ny defaultad parameter skapar en NY funktion i stället för att ersätta
-- den gamla.
DROP FUNCTION IF EXISTS public.create_shared_list_recipe(
  uuid, text, integer, jsonb, jsonb
);

DROP FUNCTION IF EXISTS public.create_shared_list_recipe(
  uuid, text, integer, jsonb, jsonb, text, text, text[], integer, integer
);
