const { serialize, deserialize } = require('../index.js');

describe('Сериализация переменной длины с префиксом длины (1..300)', () => {
	// ------------------------
	// 1. Простейшие тесты
	// ------------------------
	test('Пустой массив', () => {
		const arr = [];
		const encoded = serialize(arr);
		// Должны получить ровно 2 символа (т.к. длина = 0)
		expect(encoded).toHaveLength(2);

		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	test('Маленькие числа: 1..10', () => {
		const arr = [1, 2, 10];
		const encoded = serialize(arr);
		// длина=3 => 2 символа на length + 3 символа на 3 числа = итого 5
		expect(encoded).toHaveLength(5);

		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	test('Края диапазона: 1, 10, 11, 300', () => {
		const arr = [1, 10, 11, 300];
		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	// ------------------------
	// 2. Примеры со случайными массивами
	// ------------------------
	test('Случайный массив из 15 чисел (короткий)', () => {
		const arr = Array.from({ length: 15 }, () => Math.floor(Math.random() * 300) + 1);
		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	test('Случайный массив из 50 чисел', () => {
		const arr = Array.from({ length: 50 }, () => Math.floor(Math.random() * 300) + 1);
		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	test('Случайный массив из 100 чисел', () => {
		const arr = Array.from({ length: 100 }, () => Math.floor(Math.random() * 300) + 1);
		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	test('Случайный массив из 500 чисел', () => {
		const arr = Array.from({ length: 500 }, () => Math.floor(Math.random() * 300) + 1);
		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	test('Случайный массив из 1000 чисел (граница)', () => {
		const arr = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 300) + 1);
		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);

		// Попытка сериализовать 1001 элемент -> ожидаем ошибку
		// Т.к. код выкидывает сообщение «Длина массива XXX превышает максимальное значение XXX»,
		// ловим подстроку /превышает максимальное значение/
		expect(() => serialize([...arr, 200])).toThrow(/превышает максимальное значение/);
	});

	// ------------------------
	// 3. Граничные варианты по разрядности
	// ------------------------
	test('Все числа 1 знака (1..9)', () => {
		const arr = Array.from({ length: 9 }, (_, i) => i + 1); 
		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	test('Все числа 2 знаков (10..99)', () => {
		// Создаём массив [10, 11, 12, ..., 99]
		const arr = Array.from({ length: 90 }, (_, i) => 10 + i);
		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	test('Все числа 3 знаков (100..300)', () => {
		// Массив [100, 101, ..., 300]
		const arr = Array.from({ length: 201 }, (_, i) => 100 + i);
		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	test('Каждого числа по 3 (1..300) - всего чисел 900', () => {
		// Для каждого i в 1..300, повторяем его 3 раза
		const arr = [];
		for (let i = 1; i <= 300; i++) {
			arr.push(i, i, i);
		}
		expect(arr).toHaveLength(900);

		const encoded = serialize(arr);
		const decoded = deserialize(encoded);
		expect(decoded).toEqual(arr);
	});

	// ------------------------
	// 4. Проверка выброса ошибок и "плохих" случаев
	// ------------------------
	test('Число, выходящее за пределы диапазона, выбрасывает ошибку (например, 0 или 301)', () => {
		expect(() => serialize([0])).toThrow(RangeError);
		expect(() => serialize([301])).toThrow(RangeError);
	});

	test('Обрезанные данные', () => {
		// Сериализуем 2 числа
		const encoded = serialize([11, 300]);
		// Удалим последний символ
		const truncated = encoded.slice(0, -1);
		// Код, судя по всему, выкидывает «Строка неожиданно завершилась…»
		expect(() => deserialize(truncated)).toThrow(/Строка неожиданно завершилась/);
	});

	test('Дополнительные данные после декодирования', () => {
		// Сериализуем один элемент
		const encoded = serialize([10]);
		// Допишем лишнее
		const corrupted = encoded + 'xyz';
		// Код выкидывает «Дополнительные данные…»
		expect(() => deserialize(corrupted)).toThrow(/Дополнительные данные/);
	});

	test('Недопустимые символы в двухсимвольном режиме', () => {
		// Возьмём корректную сериализацию одного элемента: [300]
		const encoded = serialize([300]);
		// encoded = <2 символа на длину (для length=1)> + <2 символа для 300>
		// Изменим 3-й символ (первый символ числа) на несуществующий (например, '%')
		const corrupted = encoded.slice(0, 2) + '%' + encoded.slice(3);
		// Код выкидывает «Неправильный символ '%'…»
		expect(() => deserialize(corrupted)).toThrow(/Неправильный символ/);
	});
});