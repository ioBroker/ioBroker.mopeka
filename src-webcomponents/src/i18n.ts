/** The words the element shows, in the languages of ioBroker; the words of the manifest are in `manifest.ts` */
const EN = {
    chooseSensor: 'Choose a sensor or an instance in the settings',
    noSensors: 'No sensors configured',
    offline: 'offline',
    noHeight: 'Set the tank height in the adapter to see the fill level in %',
    temperature: 'Temperature',
    battery: 'Battery',
    quality: 'Reading quality',
};

export type WordKey = keyof typeof EN;

const WORDS: Partial<Record<ioBroker.Languages, Record<WordKey, string>>> = {
    en: EN,
    de: {
        chooseSensor: 'Sensor oder Instanz in den Einstellungen wählen',
        noSensors: 'Keine Sensoren konfiguriert',
        offline: 'offline',
        noHeight: 'Tankhöhe im Adapter eintragen, um den Füllstand in % zu sehen',
        temperature: 'Temperatur',
        battery: 'Batterie',
        quality: 'Messqualität',
    },
    ru: {
        chooseSensor: 'Выберите датчик или экземпляр в настройках',
        noSensors: 'Датчики не настроены',
        offline: 'нет связи',
        noHeight: 'Укажите высоту бака в адаптере, чтобы видеть уровень в %',
        temperature: 'Температура',
        battery: 'Батарея',
        quality: 'Качество измерения',
    },
    pt: {
        chooseSensor: 'Escolha um sensor ou uma instância nas definições',
        noSensors: 'Nenhum sensor configurado',
        offline: 'offline',
        noHeight: 'Defina a altura do tanque no adaptador para ver o nível em %',
        temperature: 'Temperatura',
        battery: 'Bateria',
        quality: 'Qualidade da leitura',
    },
    nl: {
        chooseSensor: 'Kies een sensor of een instantie in de instellingen',
        noSensors: 'Geen sensoren geconfigureerd',
        offline: 'offline',
        noHeight: 'Stel de tankhoogte in de adapter in om het vulniveau in % te zien',
        temperature: 'Temperatuur',
        battery: 'Batterij',
        quality: 'Meetkwaliteit',
    },
    fr: {
        chooseSensor: 'Choisissez un capteur ou une instance dans les paramètres',
        noSensors: 'Aucun capteur configuré',
        offline: 'hors ligne',
        noHeight: "Indiquez la hauteur du réservoir dans l'adaptateur pour voir le niveau en %",
        temperature: 'Température',
        battery: 'Batterie',
        quality: 'Qualité de mesure',
    },
    it: {
        chooseSensor: "Scegli un sensore o un'istanza nelle impostazioni",
        noSensors: 'Nessun sensore configurato',
        offline: 'offline',
        noHeight: "Imposta l'altezza del serbatoio nell'adattatore per vedere il livello in %",
        temperature: 'Temperatura',
        battery: 'Batteria',
        quality: 'Qualità della lettura',
    },
    es: {
        chooseSensor: 'Elija un sensor o una instancia en los ajustes',
        noSensors: 'No hay sensores configurados',
        offline: 'sin conexión',
        noHeight: 'Indique la altura del depósito en el adaptador para ver el nivel en %',
        temperature: 'Temperatura',
        battery: 'Batería',
        quality: 'Calidad de lectura',
    },
    pl: {
        chooseSensor: 'Wybierz czujnik lub instancję w ustawieniach',
        noSensors: 'Brak skonfigurowanych czujników',
        offline: 'offline',
        noHeight: 'Ustaw wysokość zbiornika w adapterze, aby zobaczyć poziom w %',
        temperature: 'Temperatura',
        battery: 'Bateria',
        quality: 'Jakość pomiaru',
    },
    uk: {
        chooseSensor: 'Виберіть датчик або екземпляр у налаштуваннях',
        noSensors: 'Датчики не налаштовано',
        offline: "немає зв'язку",
        noHeight: 'Вкажіть висоту бака в адаптері, щоб бачити рівень у %',
        temperature: 'Температура',
        battery: 'Батарея',
        quality: 'Якість вимірювання',
    },
    'zh-cn': {
        chooseSensor: '请在设置中选择传感器或实例',
        noSensors: '未配置传感器',
        offline: '离线',
        noHeight: '在适配器中设置罐高度以查看百分比液位',
        temperature: '温度',
        battery: '电池',
        quality: '读数质量',
    },
};

export function word(key: WordKey, lang: ioBroker.Languages): string {
    return (WORDS[lang] || EN)[key];
}
