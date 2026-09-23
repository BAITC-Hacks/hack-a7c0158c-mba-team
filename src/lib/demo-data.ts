import { scoreTask } from "@/features/tasks/scoring";
import type { BusinessTask, Proposal, TaskFields, TeamProfile } from "@/features/tasks/types";

const taskDrafts: Array<{ id: string; status: BusinessTask["status"] } & TaskFields> = [
  {
    id: "demo-task-retail-demand", status: "published", title: "Прогноз спроса в магазинах", industry: "Розничная торговля",
    context: "Сейчас филиалы заказывают товары по прошлому месяцу и часто получают излишки.", need: "Нужно точнее прогнозировать спрос по товарам и магазинам.", users: "Менеджеры по закупкам и управляющие магазинами.",
    dataMaterials: "Есть 18 месяцев обезличенных продаж по дням и магазинам.", constraints: "Демо без доступа к продуктивным системам; срок — 4 недели.", expectedOutcome: "Прототип прогноза спроса и список товаров с риском дефицита.", successCriteria: "Сравнить ошибку прогноза с текущим методом на отложенных данных.", contact: "Руководитель закупок.", interactionFormat: "Еженедельная онлайн-консультация.",
  },
  {
    id: "demo-task-clinic-queue", status: "published", title: "Сократить ожидание в клинике", industry: "Здравоохранение",
    context: "Пациенты не понимают, сколько ждать приёма.", need: "Нужно дать регистратуре способ оценивать текущую очередь.", users: "Сотрудники регистратуры и пациенты.",
    dataMaterials: "Есть обезличенные отметки времени записи и начала приёма за 3 месяца.", constraints: "Нельзя использовать персональные данные пациентов.", expectedOutcome: "Интерактивный прототип оценки времени ожидания.", successCriteria: "", contact: "Администратор клиники.", interactionFormat: "Две консультации в неделю.",
  },
  {
    id: "demo-task-energy", status: "published", title: "Найти лишний расход энергии", industry: "Энергетика",
    context: "В офисном здании расход энергии заметно меняется между похожими днями.", need: "Нужно находить помещения с необычным потреблением.", users: "Инженер эксплуатации.",
    dataMaterials: "Есть почасовые показания счётчиков за год и календарь рабочих дней.", constraints: "", expectedOutcome: "", successCriteria: "", contact: "Инженер эксплуатации.", interactionFormat: "Еженедельная встреча.",
  },
  {
    id: "demo-task-delivery", status: "published", title: "Понятнее показывать статус доставки", industry: "Логистика",
    context: "Клиенты звонят оператору, чтобы узнать, где находится заказ.", need: "Нужно показывать клиенту понятный статус и следующий шаг доставки.", users: "Клиенты интернет-магазина.",
    dataMaterials: "", constraints: "Решение должно работать как кликабельный прототип. Примеры статусов пока не предоставлены.", expectedOutcome: "Кликабельный прототип страницы статуса заказа.", successCriteria: "Проверить прототип на пяти сценариях доставки.", contact: "", interactionFormat: "",
  },
  {
    id: "demo-task-training", status: "published", title: "Помочь сотрудникам находить обучение", industry: "Образование",
    context: "Сотрудникам сложно выбирать курсы из длинного списка.", need: "Нужно помочь находить подходящее обучение.", users: "Сотрудники компании.",
    dataMaterials: "",
    constraints: "",
    expectedOutcome: "",
    successCriteria: "",
    contact: "",
    interactionFormat: "",
  },
];

export const demoTasks: BusinessTask[] = taskDrafts.map(({ id, status, ...fields }) => {
  const { score, readinessLevel } = scoreTask(fields);
  return { ...fields, id, status, score, readinessLevel, confirmedAt: "2026-09-23T09:00:00.000Z" };
});

export const demoTeams: TeamProfile[] = [
  { id: "team-data-lab", name: "Data Lab", interests: ["аналитика", "ритейл"], skills: ["аналитика данных", "ML"], technologies: ["Python", "pandas"] },
  { id: "team-flow", name: "Flow Team", interests: ["здравоохранение", "сервисы"], skills: ["UX", "прототипирование"], technologies: ["Figma", "React"] },
  { id: "team-green", name: "Green Stack", interests: ["энергетика", "устойчивое развитие"], skills: ["дашборды", "обработка данных"], technologies: ["Python", "Next.js"] },
  { id: "team-route", name: "Route Makers", interests: ["логистика", "e-commerce"], skills: ["дизайн интерфейсов", "веб-разработка"], technologies: ["Figma", "TypeScript"] },
  { id: "team-learn", name: "LearnLab", interests: ["образование", "рекомендации"], skills: ["исследования", "UX"], technologies: ["React", "Figma"] },
];

export const demoProposals: Proposal[] = [
  { id: "demo-proposal-1", taskId: demoTasks[0].id, teamId: demoTeams[0].id, teamName: demoTeams[0].name, idea: "Сравнить сезонный базовый прогноз с простыми моделями по товару и филиалу.", plan: "Очистить выборку, собрать baseline, сравнить метрики и показать результаты в дашборде.", timeline: "3 недели", prototypeUrl: "", status: "pending", createdAt: "2026-09-23T09:10:00.000Z" },
  { id: "demo-proposal-2", taskId: demoTasks[0].id, teamId: demoTeams[1].id, teamName: demoTeams[1].name, idea: "Сделать прозрачный экран с прогнозом, дефицитом и факторами спроса.", plan: "Согласовать сценарии, собрать прототип и проверить его с закупщиками.", timeline: "2 недели", prototypeUrl: "", status: "pending", createdAt: "2026-09-23T09:15:00.000Z" },
  { id: "demo-proposal-3", taskId: demoTasks[1].id, teamId: demoTeams[1].id, teamName: demoTeams[1].name, idea: "Оценивать ожидание по фактической длительности предыдущих приёмов.", plan: "Проверить качество временных отметок и подготовить прототип экрана очереди.", timeline: "3 недели", prototypeUrl: "", status: "pending", createdAt: "2026-09-23T09:20:00.000Z" },
  { id: "demo-proposal-4", taskId: demoTasks[2].id, teamId: demoTeams[2].id, teamName: demoTeams[2].name, idea: "Показывать инженеру отклонения от обычного уровня потребления.", plan: "Подготовить базовые профили расхода и проверить найденные отклонения с инженером.", timeline: "4 недели", prototypeUrl: "", status: "pending", createdAt: "2026-09-23T09:25:00.000Z" },
  { id: "demo-proposal-5", taskId: demoTasks[3].id, teamId: demoTeams[3].id, teamName: demoTeams[3].name, idea: "Сгруппировать статусы доставки в понятные этапы для клиента.", plan: "Собрать карту сценариев, нарисовать прототип и пройти пять сценариев.", timeline: "2 недели", prototypeUrl: "", status: "pending", createdAt: "2026-09-23T09:30:00.000Z" },
];
