// Для чисел 1..10: каждый кодируется одним символом (0..9)
//   '0' означает 1, '1' => 2, ..., '9' => 10
const singleChars = '0123456789';

// Для чисел 11..300: два символа
//   Первый символ — из этого набора (26 строчных букв a..z)
const doubleFirst = 'abcdefghijklmnopqrstuvwxyz';
//   Второй символ (или для общей кодировки длины) — base-62:
const allChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Максимальное количество элементов в массиве
const MAX_LENGTH = 1000;

/**
 * Кодирует число n (0..3843) в 2 символа base-62.
 *  - 62^2 = 3844, 2 символа покрывают диапазон 0..3843
 * @param {number} n
 * @returns {string} (ровно 2 символа)
 */
function encodeBase(n) {
	if (n < 0 || n > 3843) {
		throw new Error(`Число ${n} вне диапазона для двузначного числа base-62`);
	}
	const a = Math.floor(n / 62);
	const b = n % 62;
	return allChars[a] + allChars[b];
}

/**
 * Декодирует 2 base-62 символа в число (0..3843).
 * @param {string} ch1
 * @param {string} ch2
 * @returns {number}
 */
function decodeBase(ch1, ch2) {
	const a = allChars.indexOf(ch1);
	const b = allChars.indexOf(ch2);
	if (a < 0 || b < 0) {
		throw new Error(`Недопустимые цифры: "${ch1}" или "${ch2}"`);
	}
	return a * 62 + b;
}

/**
 * Сериализует массив чисел (каждое 1..300) в строку ASCII.
 * Формат итоговой строки:
 *   [2 символа base-62: длина массива (0..1000)]
 *   [последовательно закодированные числа]
 *
 * - Числа 1..10 → 1 символ из singleChars
 * - Числа 11..300 → 2 символа: первый из doubleFirst, второй из allChars
 *
 * @param {number[]} arr
 * @returns {string} Сериализованная строка
 */
function serialize(arr) {
	if (arr.length > MAX_LENGTH) {
		throw new Error(`Длина массива ${arr.length} превышает максимальное значение ${MAX_LENGTH}`);
	}

	// Кодируем длину массива (два символа base-62)
	let result = encodeBase(arr.length);

	// Кодируем каждый элемент
	for (const num of arr) {
		if (num < 1 || num > 300) {
			throw new RangeError(`Number ${num} out of range 1..300`);
		}

		if (num <= 10) {
			// Односимвольная кодировка (1 → '0', 10 → '9')
			result += singleChars[num - 1];
		} else {
			// Двухсимвольная кодировка (11..300)
			const n = num - 11; // диапазон 0..289
			const a = Math.floor(n / 62); // максимум 4 (потому что 289/62 ~4.66)
			const b = n % 62;
			if (!doubleFirst[a]) {
				throw new Error(`Не удалось закодировать число ${num}, индекс a=${a} выходит за пределы диапазона doubleFirst`);
			}
			if (!allChars[b]) {
				throw new Error(`Не удалось закодировать число ${num}, индекс b=${b} вышел из диапазона allChars`);
			}
			result += doubleFirst[a] + allChars[b];
		}
	}

	return result;
}

/**
 * Десериализует строку, полученную из serialize(...).
 * @param {string} str
 * @returns {number[]} Восстановленный массив
 */
function deserialize(str) {
	// Минимум 2 символа, чтобы было что декодировать как длину
	if (str.length < 2) {
		throw new Error('Входная строка слишком короткая: невозможно декодировать длину');
	}

	// 1) Считываем длину массива
	const length = decodeBase(str[0], str[1]);
	let i = 2; // текущая позиция в строке (после 2 символов длины)
	const arr = [];

	// 2) Читаем ровно length чисел
	while (arr.length < length) {
		if (i >= str.length) {
			throw new Error(`Обрезанные данные: ожидалось ${length} чисел, получено только ${arr.length}`);
		}

		const ch = str[i];
		// Если символ есть в singleChars, значит число 1..10
		if (singleChars.includes(ch)) {
			const idx = singleChars.indexOf(ch); // 0..9
			arr.push(idx + 1); // => 1..10
			i += 1;
		} else {
			// Иначе пытаемся считать два символа
			if (i + 1 >= str.length) {
				throw new Error('Строка неожиданно завершилась при расшифровке двухсимвольного числа');
			}
			const ch2 = str[i + 1];

			// Первый символ должен быть из doubleFirst
			const a = doubleFirst.indexOf(ch);
			if (a < 0) {
				throw new Error(`Неправильный символ '${ch}' для первого символа (ожидалось doubleFirst)`);
			}

			// Второй символ должен быть из allChars
			const b = allChars.indexOf(ch2);
			if (b < 0) {
				throw new Error(`Неправильный символ '${ch2}' для второго символа (ожидалось allChars)`);
			}

			arr.push(11 + a * 62 + b);
			i += 2;
		}
	}

	// 3) Проверяем, что мы ровно дошли до конца массива (и нет лишних данных)
	if (i !== str.length) {
		throw new Error(`Дополнительные данные после чисел ${length} (разобрано до index=${i}, всего length=${str.length})`);
	}

	return arr;
}

// Экспортируем функции
module.exports = {
	serialize,
	deserialize
};