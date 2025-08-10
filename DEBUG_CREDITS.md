# 🐛 Отладка проблемы со списанием кредитов

## ❌ **Проблема:**
Было 40 кредитов → после генерации изображения → все еще 40 кредитов (не списался 1 кредит)

## 🔍 **Возможные причины:**

### 1. **Функция `deductCredit` не вызывается**
- Проверьте консоль браузера на наличие логов:
  ```
  💳 Credit deducted before transformation, remaining: 39
  ✅ Transformation successful
  ```

### 2. **Ошибка в функции `deductCredit`**
- Возможно функция не работает с демо-системой
- Проверьте localStorage: `localStorage.getItem('demo_credits')`

### 3. **Состояние не обновляется в UI**
- Кредиты списываются, но интерфейс не обновляется
- Нужно проверить `setCredits` функцию

## 🧪 **Диагностика (шаг за шагом):**

### **Шаг 1: Откройте консоль браузера (F12)**

### **Шаг 2: Проверьте текущие демо-кредиты**
```javascript
localStorage.getItem('demo_credits')
// Должно показать: "40"
```

### **Шаг 3: Попробуйте генерацию изображения**
Ожидаемые логи в консоли:
```
💳 Credit deducted before transformation, remaining: 39
✅ Transformation successful
🎮 Using demo credits: 39  // (или аналогичное)
```

### **Шаг 4: Проверьте localStorage после генерации**
```javascript
localStorage.getItem('demo_credits')
// Должно показать: "39"
```

### **Шаг 5: Проверьте UI**
- Обновится ли счетчик кредитов в header/dashboard?
- Если нет → проблема в обновлении состояния React

## 🔧 **Исправления внесены:**

### **1. Перенос `deductCredit` перед трансформацией:**
```javascript
// БЫЛО: deductCredit() после успешной трансформации
try {
  const blob = await api.transformImage(...);
  deductCredit(); // могло не выполниться при ошибке
}

// СТАЛО: deductCredit() перед трансформацией  
try {
  await deductCredit(); // всегда выполняется
  const blob = await api.transformImage(...);
}
```

### **2. Добавлены логи для диагностики:**
```javascript
console.log('💳 Credit deducted before transformation, remaining:', credits - 1);
console.log('✅ Transformation successful');
```

## 🎯 **Что проверить СЕЙЧАС:**

### **В главном приложении (localhost:3000):**
1. Обновите страницу (F5)
2. Откройте консоль (F12) 
3. Проверьте текущие кредиты: `localStorage.getItem('demo_credits')`
4. Загрузите изображение
5. Попробуйте генерацию
6. Проверьте логи в консоли
7. Проверьте новое значение: `localStorage.getItem('demo_credits')`

### **Если проблема не решилась:**

#### **Manual Test Demo System:**
```javascript
// В консоли браузера:
const demoPaymentSystem = {
  getDemoCredits: () => parseInt(localStorage.getItem('demo_credits') || '0'),
  setDemoCredits: (credits) => localStorage.setItem('demo_credits', credits.toString()),
  useCredit: () => {
    const credits = parseInt(localStorage.getItem('demo_credits') || '0');
    if (credits > 0) {
      localStorage.setItem('demo_credits', (credits - 1).toString());
      return true;
    }
    return false;
  }
};

// Тест:
console.log('Before:', demoPaymentSystem.getDemoCredits());
demoPaymentSystem.useCredit();
console.log('After:', demoPaymentSystem.getDemoCredits());
```

## 🚨 **Если кредиты все равно не списываются:**

### **Возможные проблемы:**
1. **deductCredit функция получает не те данные**
2. **localStorage не обновляется** 
3. **React state и localStorage не синхронизированы**
4. **Функция вызывается но с ошибкой**

### **Последний тест:**
Временно добавьте alert в функцию deductCredit для проверки:
```javascript
const deductCredit = async () => {
  alert('deductCredit called with credits: ' + credits);
  // остальной код...
}
```

## 📊 **Ожидаемое поведение:**
1. **До генерации:** 40 кредитов
2. **Нажатие Transform** → сразу списывается кредит  
3. **После генерации:** 39 кредитов
4. **В localStorage:** "39"
5. **В интерфейсе:** обновленный счетчик

---

**Протестируйте и дайте знать что показывает консоль!** 🔍