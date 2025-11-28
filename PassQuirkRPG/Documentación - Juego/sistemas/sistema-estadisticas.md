# 📊 Sistema Estadísticas

{% columns %}
{% column %}
HP Base: 100\
Energía Base: 100\
Ataque Base: 10\
Defensa Base: 5\
Velocidad Base: 10
{% endcolumn %}

{% column %}
Niveles 1-9: Multiplicador x1.15 por nivel\
Nivel 10: Multiplicador x1.7 (salto grande)\
Niveles 11-19: Multiplicador x1.15 por nivel\
Nivel 20: Multiplicador x1.7\
(Y así sucesivamente cada 10 niveles)
{% endcolumn %}
{% endcolumns %}

#### **Sistema de Energía CORREGIDO:**

* **Regeneración: +10 energía/turno**
* **Ataque básico: 10-15 energía**
* **Poder Básico: 30 energía**
* **Poder Especial: 70 energía**

#### **Sistema de Daño SIMPLIFICADO:**

* **Daño Normal:** Calculado como % del ATK
* **Daño Crítico:** Daño Normal x2

> Nivel 1→2: 100 EXP> \
> Nivel 2→3: 150 EXP> \
> Cada nivel: EXP\_anterior × 1.3> \
> Nivel 9→10: 850 EXP (más difícil)

{% tabs %}
{% tab title="Ejemplo Escalado Nivel 10" %}
ATK Nivel 10: 10 × 1.7 = 17

* Ataque Básico: 25.5 daño (150% de 17)
* Poder Básico: 47.6 daño (280% de 17)
* Poder Especial: 76.5 daño total (450% de 17)
{% endtab %}
{% endtabs %}
