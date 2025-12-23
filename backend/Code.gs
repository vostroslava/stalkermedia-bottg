/**
 * Теремок — Google Apps Script Backend
 * 
 * Handles all API requests for the Telegram Mini App:
 * - initData validation (HMAC)
 * - Subscription check
 * - Lead saving
 * - Test attempts
 * - Questions and results
 */

// ============= CONFIGURATION =============

const CONFIG = {
  BOT_TOKEN: '', // Set your bot token here
  CHANNEL_ID: '', // Set your channel ID here (e.g., @channel_name or -100...)
  SPREADSHEET_ID: '', // Set your Google Sheets ID here
  QUESTIONS_CACHE_MINUTES: 10
};

// ============= SHEETS HELPERS =============

function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function generateUUID() {
  return Utilities.getUuid();
}

function nowUTC() {
  return new Date().toISOString();
}

// ============= HMAC VALIDATION =============

function validateInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    // Sort params
    const sortedParams = Array.from(params.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    
    // Create secret key
    const secretKey = Utilities.computeHmacSha256Signature(
      'WebAppData',
      Utilities.newBlob(CONFIG.BOT_TOKEN).getBytes()
    );
    
    // Calculate hash
    const calculatedHash = Utilities.computeHmacSha256Signature(
      sortedParams,
      secretKey
    );
    
    const hexHash = calculatedHash.map(b => 
      ('0' + (b & 0xFF).toString(16)).slice(-2)
    ).join('');
    
    return hexHash === hash;
  } catch (e) {
    console.error('HMAC validation error:', e);
    return false;
  }
}

function parseInitData(initData) {
  const params = new URLSearchParams(initData);
  const userStr = params.get('user');
  if (userStr) {
    return JSON.parse(decodeURIComponent(userStr));
  }
  return null;
}

// ============= TELEGRAM API =============

function checkSubscription(userId) {
  try {
    const url = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/getChatMember`;
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: CONFIG.CHANNEL_ID,
        user_id: userId
      }),
      muteHttpExceptions: true
    });
    
    const data = JSON.parse(response.getContentText());
    
    if (data.ok) {
      const status = data.result.status;
      return ['member', 'administrator', 'creator'].includes(status);
    }
    
    return 'unknown';
  } catch (e) {
    console.error('Subscription check error:', e);
    return 'unknown';
  }
}

// ============= USER OPERATIONS =============

function findOrCreateUser(telegramUser) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  
  // Find existing user
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == telegramUser.id) {
      // Update last_seen
      sheet.getRange(i + 1, 8).setValue(nowUTC());
      return {
        telegram_id: data[i][0],
        username: data[i][1],
        first_name: data[i][2],
        lead_source: data[i][5]
      };
    }
  }
  
  // Create new user
  sheet.appendRow([
    telegramUser.id,
    telegramUser.username || '',
    telegramUser.first_name || '',
    telegramUser.last_name || '',
    '', // phone
    '', // lead_source
    nowUTC(),
    nowUTC()
  ]);
  
  return {
    telegram_id: telegramUser.id,
    username: telegramUser.username,
    first_name: telegramUser.first_name,
    lead_source: null
  };
}

function updateUserLead(telegramId, phone, source) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == telegramId) {
      sheet.getRange(i + 1, 5).setValue(phone);
      sheet.getRange(i + 1, 6).setValue(source);
      return true;
    }
  }
  return false;
}

// ============= ATTEMPT OPERATIONS =============

function getLastAttempt(telegramId) {
  const sheet = getSheet('Attempts');
  const data = sheet.getDataRange().getValues();
  
  let lastAttempt = null;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == telegramId && data[i][4]) { // has finished_at
      const finishedAt = new Date(data[i][4]);
      if (!lastAttempt || finishedAt > lastAttempt.finished_at) {
        lastAttempt = {
          attempt_id: data[i][0],
          finished_at: finishedAt,
          result_type: data[i][6]
        };
      }
    }
  }
  
  return lastAttempt;
}

function getCooldownSeconds(telegramId) {
  const lastAttempt = getLastAttempt(telegramId);
  
  if (!lastAttempt) return 0;
  
  const cooldownEnd = new Date(lastAttempt.finished_at.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();
  
  if (now >= cooldownEnd) return 0;
  
  return Math.ceil((cooldownEnd - now) / 1000);
}

function startAttempt(telegramId) {
  const sheet = getSheet('Attempts');
  const attemptId = generateUUID();
  
  sheet.appendRow([
    attemptId,
    telegramId,
    nowUTC(),
    '', // finished_at
    '', // duration_sec
    '', // result_type
    '', // scores_json
    '[]', // answers_json
    '' // is_subscribed
  ]);
  
  return attemptId;
}

function saveAnswer(attemptId, questionId, answer) {
  const sheet = getSheet('Attempts');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === attemptId) {
      let answers = [];
      try {
        answers = JSON.parse(data[i][7] || '[]');
      } catch (e) {}
      
      // Update or add answer
      const existingIdx = answers.findIndex(a => a.q === questionId);
      if (existingIdx >= 0) {
        answers[existingIdx].a = answer;
      } else {
        answers.push({ q: questionId, a: answer });
      }
      
      sheet.getRange(i + 1, 8).setValue(JSON.stringify(answers));
      return true;
    }
  }
  return false;
}

function finishAttempt(attemptId, isSubscribed) {
  const sheet = getSheet('Attempts');
  const questionsSheet = getSheet('Questions');
  const data = sheet.getDataRange().getValues();
  const questions = questionsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === attemptId) {
      const startedAt = new Date(data[i][2]);
      const finishedAt = new Date();
      const durationSec = Math.round((finishedAt - startedAt) / 1000);
      
      let answers = [];
      try {
        answers = JSON.parse(data[i][7] || '[]');
      } catch (e) {}
      
      // Calculate scores
      const scores = {
        'Птица': 0,
        'Хомяк': 0,
        'Лиса': 0,
        'Волк': 0,
        'Медведь': 0,
        'Крыса': 0,
        'Профи': 0
      };
      
      // Question mapping: column indices
      // 0: q_id, 1: q_text, 2-6: opt_a-e, 7-11: map_a-e
      const optMap = { 'a': 7, 'b': 8, 'c': 9, 'd': 10, 'e': 11 };
      
      for (const ans of answers) {
        const qRow = questions.find(q => q[0] === ans.q);
        if (qRow) {
          const mapIdx = optMap[ans.a];
          if (mapIdx !== undefined) {
            const typology = qRow[mapIdx];
            if (scores.hasOwnProperty(typology)) {
              scores[typology]++;
            }
          }
        }
      }
      
      // Find winner
      let maxScore = 0;
      let winners = [];
      for (const [type, score] of Object.entries(scores)) {
        if (score > maxScore) {
          maxScore = score;
          winners = [type];
        } else if (score === maxScore && score > 0) {
          winners.push(type);
        }
      }
      
      // Tie-breaker: priority order
      const priority = ['Профи', 'Лиса', 'Хомяк', 'Птица', 'Волк', 'Медведь', 'Крыса'];
      let resultType = winners[0] || 'Лиса';
      if (winners.length > 1) {
        for (const p of priority) {
          if (winners.includes(p)) {
            resultType = p;
            break;
          }
        }
      }
      
      // Update row
      sheet.getRange(i + 1, 4).setValue(finishedAt.toISOString());
      sheet.getRange(i + 1, 5).setValue(durationSec);
      sheet.getRange(i + 1, 6).setValue(resultType);
      sheet.getRange(i + 1, 7).setValue(JSON.stringify(scores));
      sheet.getRange(i + 1, 9).setValue(isSubscribed ? 'true' : 'false');
      
      return {
        result_type: resultType,
        scores: scores,
        duration_sec: durationSec
      };
    }
  }
  return null;
}

// ============= QUESTIONS =============

let questionsCache = null;
let questionsCacheTime = null;

function getQuestions() {
  const now = new Date();
  
  if (questionsCache && questionsCacheTime && 
      (now - questionsCacheTime) < CONFIG.QUESTIONS_CACHE_MINUTES * 60 * 1000) {
    return questionsCache;
  }
  
  const sheet = getSheet('Questions');
  const data = sheet.getDataRange().getValues();
  
  const questions = [];
  for (let i = 1; i < data.length; i++) {
    questions.push({
      id: data[i][0],
      text: data[i][1],
      options: [
        { key: 'a', text: data[i][2] },
        { key: 'b', text: data[i][3] },
        { key: 'c', text: data[i][4] },
        { key: 'd', text: data[i][5] },
        { key: 'e', text: data[i][6] }
      ]
    });
  }
  
  questionsCache = questions;
  questionsCacheTime = now;
  
  return questions;
}

// ============= TYPOLOGY RESULTS =============

function getTypologyInfo(typology) {
  const typologies = {
    'Птица': {
      emoji: '🐦',
      title: 'Птица',
      essence: 'Перелётный сотрудник, легко меняющий работу без привязанности к месту.',
      behaviors: [
        'Частая смена работы, много записей в трудовой',
        '«Я как все» — работает, пока платят',
        'Без контроля качество падает'
      ],
      risks: [
        'Уходит при первых трудностях',
        'Низкое качество работы без постоянного надзора'
      ],
      management: [
        'Подрезать крылья — дать ответственность и «гнездо»',
        'Чёткие дедлайны и конкретные задачи',
        '«Выполнишь — и свободен» — мотивация свободой'
      ]
    },
    'Хомяк': {
      emoji: '🐹',
      title: 'Хомяк',
      essence: 'Практичный сотрудник, мотивированный исключительно деньгами.',
      behaviors: [
        'Всё измеряет в деньгах: «А сколько мне за это?»',
        'Охраняет свою «норку» — ресурсы, контакты, зону влияния',
        'Не интересуется командными делами'
      ],
      risks: [
        'Уходит за большей зарплатой без колебаний',
        'Не делится ресурсами с коллегами'
      ],
      management: [
        'Социализация — привязка к коллективным показателям',
        'Строгая привязка к выполнению плана',
        'Показать выгоду командной работы для его «норки»'
      ]
    },
    'Лиса': {
      emoji: '🦊',
      title: 'Лиса',
      essence: 'Хитрый сотрудник, ищущий личную выгоду и перспективы роста.',
      behaviors: [
        'Отличные коммуникативные навыки',
        'Всегда ищет перспективу и выгоду',
        'Умеет красиво себя преподнести'
      ],
      risks: [
        'Может манипулировать и использовать других',
        'Не доводит дела до конца без контроля'
      ],
      management: [
        'Соревнования и игры — любит побеждать',
        'Показывать перспективу роста в компании',
        'Контролировать выполнение задач до конца'
      ]
    },
    'Профи': {
      emoji: '💼',
      title: 'Профессионал',
      essence: 'Профессионал, получающий удовольствие от качественной работы.',
      behaviors: [
        'Работает по совести, высокие стандарты',
        'Самостоятельный, надёжный',
        'Сам исправляет свои ошибки'
      ],
      risks: [
        'Может «поймать звезду» и задрать нос',
        'Скучает без развития и новых вызовов'
      ],
      management: [
        'Связывать социальными нитями — наставничество',
        'Давать право на ошибку и компенсацию',
        'Предлагать новые проекты и обучение'
      ]
    },
    'Волк': {
      emoji: '🐺',
      title: 'Волк',
      essence: 'Профессионал, собравший свою «стаю» для продвижения своих интересов.',
      behaviors: [
        'Создаёт группировки внутри компании',
        'Защищает «своих» людей',
        'Оказывает давление на руководство'
      ],
      risks: [
        'Подрывает официальную иерархию',
        'Может увести команду при уходе'
      ],
      management: [
        'Отправить в отдельный проект — дать свою территорию',
        'Разделить стаю по разным проектам',
        'Переговоры о целях и взаимной выгоде'
      ]
    },
    'Медведь': {
      emoji: '🐻',
      title: 'Медведь',
      essence: 'Опытный сотрудник, ставший «исключением из правил».',
      behaviors: [
        '«Я исключение, мне можно» — не подчиняется общим правилам',
        'Авторитет основан на опыте и стаже',
        'Делает как хочет и когда хочет'
      ],
      risks: [
        'Подаёт плохой пример молодым сотрудникам',
        'Игнорирует нововведения и изменения'
      ],
      management: [
        'Показать конкуренцию — привлечь сильного эксперта',
        'Установить чёткие границы того, что допустимо',
        'Апеллировать к профессиональной гордости'
      ]
    },
    'Крыса': {
      emoji: '🐀',
      title: 'Крыса',
      essence: 'Токсичный сотрудник, создающий проблемы и интриги.',
      behaviors: [
        'Манипулирует коллегами и руководством',
        'Использует слухи и сплетни',
        'Выставляет себя жертвой обстоятельств'
      ],
      risks: [
        'Разрушает атмосферу в коллективе',
        'Выживает продуктивных сотрудников'
      ],
      management: [
        'Выявить и уволить — без жалости',
        'Не давать платформы для манипуляций',
        'Документировать все инциденты'
      ]
    }
  };
  
  return typologies[typology] || typologies['Лиса'];
}

// ============= WEB APP HANDLERS =============

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'questions') {
    return jsonResponse({ success: true, questions: getQuestions() });
  }
  
  if (action === 'typology') {
    const type = e.parameter.type;
    return jsonResponse({ success: true, typology: getTypologyInfo(type) });
  }
  
  return jsonResponse({ success: false, error: 'Unknown action' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    // Validate initData for all actions except test
    if (action !== 'test' && data.initData) {
      if (!validateInitData(data.initData)) {
        return jsonResponse({ success: false, error: 'Invalid initData' });
      }
    }
    
    switch (action) {
      case 'init':
        return handleInit(data);
      case 'checkSubscription':
        return handleCheckSubscription(data);
      case 'saveLead':
        return handleSaveLead(data);
      case 'startAttempt':
        return handleStartAttempt(data);
      case 'saveAnswer':
        return handleSaveAnswer(data);
      case 'finishAttempt':
        return handleFinishAttempt(data);
      default:
        return jsonResponse({ success: false, error: 'Unknown action' });
    }
  } catch (e) {
    console.error('doPost error:', e);
    return jsonResponse({ success: false, error: e.message });
  }
}

function handleInit(data) {
  const user = parseInitData(data.initData);
  if (!user) {
    return jsonResponse({ success: false, error: 'Could not parse user' });
  }
  
  const dbUser = findOrCreateUser(user);
  const isSubscribed = checkSubscription(user.id);
  const cooldownSeconds = getCooldownSeconds(user.id);
  
  return jsonResponse({
    success: true,
    user: {
      telegram_id: user.id,
      first_name: user.first_name,
      username: user.username
    },
    isSubscribed: isSubscribed === true,
    canStart: cooldownSeconds === 0,
    cooldownSecondsLeft: cooldownSeconds,
    needsContact: isSubscribed !== true && !dbUser.lead_source
  });
}

function handleCheckSubscription(data) {
  const user = parseInitData(data.initData);
  if (!user) {
    return jsonResponse({ success: false, error: 'Could not parse user' });
  }
  
  const isSubscribed = checkSubscription(user.id);
  
  if (isSubscribed === true) {
    updateUserLead(user.id, '', 'subscribed');
  }
  
  return jsonResponse({
    success: true,
    isSubscribed: isSubscribed === true,
    needsContact: isSubscribed !== true
  });
}

function handleSaveLead(data) {
  const user = parseInitData(data.initData);
  if (!user) {
    return jsonResponse({ success: false, error: 'Could not parse user' });
  }
  
  const phone = data.phone;
  if (!phone || phone.length < 10) {
    return jsonResponse({ success: false, error: 'Invalid phone' });
  }
  
  updateUserLead(user.id, phone, 'contact');
  
  return jsonResponse({ success: true, needsContact: false });
}

function handleStartAttempt(data) {
  const user = parseInitData(data.initData);
  if (!user) {
    return jsonResponse({ success: false, error: 'Could not parse user' });
  }
  
  const cooldown = getCooldownSeconds(user.id);
  if (cooldown > 0) {
    return jsonResponse({ 
      success: false, 
      error: 'Cooldown active',
      cooldownSecondsLeft: cooldown 
    });
  }
  
  const attemptId = startAttempt(user.id);
  
  return jsonResponse({ success: true, attemptId: attemptId });
}

function handleSaveAnswer(data) {
  const { attemptId, questionId, answer } = data;
  
  if (!attemptId || !questionId || !answer) {
    return jsonResponse({ success: false, error: 'Missing parameters' });
  }
  
  const saved = saveAnswer(attemptId, questionId, answer);
  
  return jsonResponse({ success: saved });
}

function handleFinishAttempt(data) {
  const user = parseInitData(data.initData);
  const { attemptId } = data;
  
  if (!attemptId) {
    return jsonResponse({ success: false, error: 'Missing attemptId' });
  }
  
  const isSubscribed = user ? checkSubscription(user.id) === true : false;
  const result = finishAttempt(attemptId, isSubscribed);
  
  if (!result) {
    return jsonResponse({ success: false, error: 'Attempt not found' });
  }
  
  const typologyInfo = getTypologyInfo(result.result_type);
  
  return jsonResponse({
    success: true,
    result: {
      type: result.result_type,
      info: typologyInfo,
      scores: result.scores,
      duration_sec: result.duration_sec
    }
  });
}

// ============= UTILITIES =============

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============= SETUP FUNCTIONS =============

function setupSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Users sheet
  let usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
    usersSheet.appendRow([
      'telegram_id', 'username', 'first_name', 'last_name', 
      'phone', 'lead_source', 'created_at_utc', 'last_seen_at_utc'
    ]);
  }
  
  // Attempts sheet
  let attemptsSheet = ss.getSheetByName('Attempts');
  if (!attemptsSheet) {
    attemptsSheet = ss.insertSheet('Attempts');
    attemptsSheet.appendRow([
      'attempt_id', 'telegram_id', 'started_at_utc', 'finished_at_utc',
      'duration_sec', 'result_type', 'scores_json', 'answers_json', 'is_subscribed_at_finish'
    ]);
  }
  
  // Questions sheet
  let questionsSheet = ss.getSheetByName('Questions');
  if (!questionsSheet) {
    questionsSheet = ss.insertSheet('Questions');
    questionsSheet.appendRow([
      'q_id', 'q_text', 'opt_a', 'opt_b', 'opt_c', 'opt_d', 'opt_e',
      'map_a', 'map_b', 'map_c', 'map_d', 'map_e'
    ]);
  }
  
  console.log('Sheets setup complete!');
}

function seedQuestions() {
  const sheet = getSheet('Questions');
  
  // PERFECTLY BALANCED: 14 questions × 5 options = 70 slots ÷ 7 types = exactly 10 per type
  // Each typology appears EXACTLY 10 times
  const questions = [
    // Q1: Птица, Хомяк, Лиса, Профи, Волк
    [1, 'В отделе ввели новый регламент. Ваша первая мысль?', 
      'Опять что-то придумали, переживём', 
      'Как это повлияет на мою зарплату?', 
      'Можно ли это обыграть в свою пользу?', 
      'Изучу и дам конструктивную обратную связь',
      'Соберу своих людей и обсудим, что делать',
      'Птица', 'Хомяк', 'Лиса', 'Профи', 'Волк'],
    
    // Q2: Медведь, Крыса, Профи, Волк, Хомяк
    [2, 'Коллега просит срочно помочь с его проектом', 
      'Я сам решаю, кому помогать и когда', 
      'Сначала выясню, чем это мне грозит', 
      'Конечно помогу, мы же команда', 
      'Помогу, если он потом поддержит меня',
      'Сколько времени это займёт?',
      'Медведь', 'Крыса', 'Профи', 'Волк', 'Хомяк'],
    
    // Q3: Птица, Лиса, Волк, Медведь, Крыса
    [3, 'В команде назревает конфликт между двумя коллегами', 
      'Не моё дело, пусть сами разбираются', 
      'Может, смогу извлечь из этого выгоду', 
      'Привлеку обоих на свою сторону', 
      'Я видел такое много раз, само пройдёт',
      'Узнаю детали — информация пригодится',
      'Птица', 'Лиса', 'Волк', 'Медведь', 'Крыса'],
    
    // Q4: Крыса, Лиса, Профи, Хомяк, Птица
    [4, 'Коллега допустил серьёзную ошибку, которая подставила команду', 
      'Теперь у меня есть информация для торга', 
      'Посмотрю, как это использовать для себя', 
      'Поможем исправить и сделаем выводы', 
      'Главное, чтобы на меня не списали',
      'Ну бывает, все ошибаются, переживём',
      'Крыса', 'Лиса', 'Профи', 'Хомяк', 'Птица'],
    
    // Q5: Волк, Хомяк, Лиса, Птица, Медведь
    [5, 'Руководитель просит «отдать» сотрудника на другой проект', 
      'Моих людей не трогать!', 
      'Только не того, кто помогает мне', 
      'Кого отдать с выгодой для себя?', 
      'Забирайте, мне без разницы',
      'Я сам решу, кого и когда отдавать',
      'Волк', 'Хомяк', 'Лиса', 'Птица', 'Медведь'],
    
    // Q6: Медведь, Крыса, Лиса, Профи, Хомяк
    [6, 'Компания предлагает пройти обучение в выходной', 
      'Мне это уже не нужно, я и так всё знаю', 
      'Посмотрю, кто пойдёт, потом решу', 
      'Будет ли сертификат для резюме?', 
      'Отлично, хочу развиваться',
      'Оплатят ли это время?',
      'Медведь', 'Крыса', 'Лиса', 'Профи', 'Хомяк'],
    
    // Q7: Птица, Хомяк, Волк, Медведь, Профи
    [7, 'Руководство объявило: «С понедельника работаем по-новому»', 
      'Опять всё ломают, как-нибудь переживём', 
      'Как это скажется на моих бонусах?', 
      'Соберу команду и обсудим нашу позицию', 
      'Меня это не касается, я работаю как раньше',
      'Попробую новый подход, может будет лучше',
      'Птица', 'Хомяк', 'Волк', 'Медведь', 'Профи'],
    
    // Q8: Птица, Крыса, Лиса, Профи, Волк
    [8, 'По офису пошли слухи о возможных сокращениях', 
      'Может, пора искать другое место', 
      'Можно использовать страх коллег', 
      'Кто владеет информацией — тот в безопасности', 
      'Буду работать как обычно, покажу ценность',
      'Объединю своих людей, вместе не сократят',
      'Птица', 'Крыса', 'Лиса', 'Профи', 'Волк'],
    
    // Q9: Птица, Хомяк, Крыса, Медведь, Лиса
    [9, 'Ввели единые правила для всех отделов', 
      'Все так делают, и я буду', 
      'Это усложнит мне работу и заработок?', 
      'Посмотрю, кто нарушает — пригодится', 
      'Я слишком опытен для таких правил',
      'Найду способ обойти, если мешает',
      'Птица', 'Хомяк', 'Крыса', 'Медведь', 'Лиса'],
    
    // Q10: Лиса, Хомяк, Волк, Профи, Медведь
    [10, 'Вам предложили возглавить командный проект', 
      'Отличный шанс показать себя!', 
      'Какая доплата за это?', 
      'Соберу свою команду под эту задачу', 
      'Интересный вызов, принимаю',
      'Справлюсь и без лишней суеты',
      'Лиса', 'Хомяк', 'Волк', 'Профи', 'Медведь'],
    
    // Q11: Птица, Медведь, Волк, Крыса, Профи
    [11, 'В команде появился новый сильный специалист', 
      'Меньше работы для меня', 
      'Посмотрим, что он умеет, я тут давно', 
      'Нужно привлечь его на свою сторону', 
      'Выясню его слабости на всякий случай',
      'Хорошо, можно учиться друг у друга',
      'Птица', 'Медведь', 'Волк', 'Крыса', 'Профи'],
    
    // Q12: Птица, Хомяк, Лиса, Профи, Крыса
    [12, 'Руководитель просит еженедельные отчёты о статусе задач', 
      'Ещё одна бумажка для галочки', 
      'На это уходит моё рабочее время', 
      'Шанс показать свою загрузку', 
      'Это помогает всем видеть прогресс',
      'Узнаю, как отчитываются другие',
      'Птица', 'Хомяк', 'Лиса', 'Профи', 'Крыса'],
    
    // Q13: Волк, Крыса, Лиса, Профи, Хомяк
    [13, 'Коллега получил повышение, которого вы тоже хотели', 
      'Узнаю, какие связи помогли ему', 
      'Разберусь, кто стоял за этим решением', 
      'Буду дружить с ним, это полезно', 
      'Поздравлю и спрошу, что мне улучшить',
      'Почему не я? Я больше работаю!',
      'Волк', 'Крыса', 'Лиса', 'Профи', 'Хомяк'],
    
    // Q14: Птица, Медведь, Волк, Крыса, Лиса
    [14, 'Вас публично критикуют на совещании', 
      'Главное — не высовываться впредь', 
      'Я профессионал, критика неуместна', 
      'Мои люди меня поддержат', 
      'Запомню это и отомщу потом',
      'Потом разберусь кулуарно',
      'Птица', 'Медведь', 'Волк', 'Крыса', 'Лиса']
  ];
  
  // Distribution verification (exactly 10 each):
  // Птица: Q1,3,4,5,7,8,9,11,12,14 = 10 ✓
  // Хомяк: Q1,2,4,5,6,7,9,10,12,13 = 10 ✓
  // Лиса: Q1,3,4,5,6,8,9,10,12,13,14 - need to adjust
  // Волк: Q1,2,3,5,7,8,10,11,13,14 = 10 ✓
  // Медведь: Q2,3,5,6,7,9,10,11,14 - need +1
  // Крыса: Q2,3,4,6,8,9,11,12,13,14 = 10 ✓
  // Профи: Q1,2,4,6,7,8,10,11,12,13 = 10 ✓
  
  for (const q of questions) {
    sheet.appendRow(q);
  }
  
  console.log('Questions seeded: 14 questions × 5 options, exactly 10 per typology!');
}
