# Verificação de Horário Comercial

Este documento explica como usar as funções helper para verificar horário comercial nos nodes CONDITION e SWITCH.

**⚠️ IMPORTANTE:** O sistema usa o timezone de **São Paulo, Brasil (America/Sao_Paulo)** para todas as verificações de horário.

## Funções Disponíveis

### `isDayEnabled([dias])`
Verifica se o dia atual está na lista de dias habilitados.

**Parâmetros:**
- `dias`: Array de números (0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado)

**Exemplo:**
```javascript
isDayEnabled([1,2,3,4,5]) // true se for Segunda a Sexta
isDayEnabled([6]) // true se for Sábado
```

### `isWithinBusinessHours(horaInicio, minutoInicio, horaFim, minutoFim, [dias])`
Verifica se o horário atual está dentro do horário comercial.

**Parâmetros:**
- `horaInicio`: Hora de início (0-23)
- `minutoInicio`: Minuto de início (0-59)
- `horaFim`: Hora de fim (0-23)
- `minutoFim`: Minuto de fim (0-59)
- `dias`: Array de dias habilitados (padrão: [1,2,3,4,5] = Segunda a Sexta)

**Exemplo:**
```javascript
isWithinBusinessHours(9, 0, 18, 0, [1,2,3,4,5]) // true se for Segunda-Sexta entre 9h e 18h
isWithinBusinessHours(8, 30, 17, 30, [1,2,3,4,5,6]) // true se for Segunda-Sábado entre 8:30h e 17:30h
```

### `isOutsideBusinessHours(horaInicio, minutoInicio, horaFim, minutoFim, [dias])`
Verifica se o horário atual está fora do horário comercial.

**Parâmetros:** Mesmos de `isWithinBusinessHours`

**Exemplo:**
```javascript
isOutsideBusinessHours(9, 0, 18, 0, [1,2,3,4,5]) // true se for fora do horário Segunda-Sexta 9h-18h
```

### `getCurrentDayName()`
Retorna o nome do dia atual em inglês.

**Retorno:** 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'

**Exemplo:**
```javascript
getCurrentDayName() === 'saturday' // true se for sábado
```

### `getCurrentDay()`
Retorna o número do dia atual (0-6).

**Retorno:** 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado

**Exemplo:**
```javascript
getCurrentDay() === 6 // true se for sábado
getCurrentDay() === 0 // true se for domingo
```

### `getCurrentHour()`
Retorna a hora atual (0-23).

**Exemplo:**
```javascript
getCurrentHour() >= 18 // true se for depois das 18h
```

### `getCurrentMinute()`
Retorna o minuto atual (0-59).

## Exemplos de Uso

### Node CONDITION - Verificar se está fora do horário comercial

**Expressão:**
```javascript
isOutsideBusinessHours(9, 0, 18, 0, [1,2,3,4,5])
```

Isso retorna `true` se:
- For Domingo (0) ou Sábado (6), OU
- For Segunda-Sexta mas fora do horário 9h-18h

### Node CONDITION - Verificar se é fim de semana

**Expressão:**
```javascript
!isDayEnabled([1,2,3,4,5])
```

ou

```javascript
getCurrentDay() === 0 || getCurrentDay() === 6
```

### Node CONDITION - Verificar se é sábado específico

**Expressão:**
```javascript
getCurrentDay() === 6
```

### Node SWITCH - Verificar horário comercial

No node SWITCH, você pode usar o modo "expression" ou criar regras:

**Regra 1:**
- Value1: `isOutsideBusinessHours(9, 0, 18, 0, [1,2,3,4,5])`
- Operator: `===`
- Value2: `true`
- Output: `fora_horario`

**Regra 2:**
- Value1: `isWithinBusinessHours(9, 0, 18, 0, [1,2,3,4,5])`
- Operator: `===`
- Value2: `true`
- Output: `dentro_horario`

## Problema Comum: Sábado Desabilitado mas Ainda Recebe Triagem

Se você desabilitou o sábado mas ainda está recebendo triagem, verifique:

1. **A expressão está correta?**
   ```javascript
   // Para desabilitar sábado (dia 6):
   !isDayEnabled([6])
   
   // OU
   getCurrentDay() !== 6
   ```

2. **Está usando a função correta?**
   ```javascript
   // ERRADO - isso só verifica horário, não dia:
   isOutsideBusinessHours(9, 0, 18, 0, [1,2,3,4,5])
   
   // CORRETO - verifica dia E horário:
   isOutsideBusinessHours(9, 0, 18, 0, [1,2,3,4,5]) || getCurrentDay() === 6
   ```

3. **Para desabilitar completamente o sábado:**
   ```javascript
   // No CONDITION node:
   getCurrentDay() !== 6
   
   // No SWITCH node:
   // Regra: getCurrentDay() === 6 → output: "sabado_desabilitado"
   // Default: continua normalmente
   ```

## Exemplo: Sábado até 18:00

Se você quer que o sábado funcione até as 18:00, use:

```javascript
// No CONDITION node - verifica se está FORA do horário comercial incluindo sábado até 18h
isOutsideBusinessHours(9, 0, 18, 0, [1,2,3,4,5,6])
```

**Explicação:**
- `[1,2,3,4,5,6]` = Segunda a Sábado habilitados
- `9, 0` = Início às 9:00
- `18, 0` = Fim às 18:00
- A função retorna `true` se:
  - For Domingo (fora dos dias habilitados), OU
  - For Segunda-Sábado mas antes das 9h ou depois das 18h

**Para testar se está funcionando:**
```javascript
// Verificar se é sábado e está dentro do horário
getCurrentDay() === 6 && getCurrentHour() < 18
```

## Exemplo Completo: Workflow com Verificação de Horário

```
TRIGGER_MESSAGE (pattern: "oi")
    ↓
CONDITION (expression: isOutsideBusinessHours(9, 0, 18, 0, [1,2,3,4,5]))
    ├─ true → SEND_MESSAGE ("Estamos fora do horário comercial. Retornaremos em breve!")
    │           ↓
    │          END
    └─ false → SEND_MESSAGE ("Olá! Como posso ajudar?")
                ↓
               WAIT_REPLY
                ↓
               ...
```

## Notas Importantes

1. **Fuso Horário**: As funções usam automaticamente o timezone de **São Paulo, Brasil (America/Sao_Paulo)**. Não é necessário configurar nada adicional.

2. **Dias da Semana**: 
   - 0 = Domingo
   - 1 = Segunda
   - 2 = Terça
   - 3 = Quarta
   - 4 = Quinta
   - 5 = Sexta
   - 6 = Sábado

3. **Horário 24h**: Use formato 24 horas (0-23).

4. **Teste**: Sempre teste suas expressões antes de ativar o workflow em produção.

