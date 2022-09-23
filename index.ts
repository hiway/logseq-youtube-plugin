import '@logseq/libs';
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';

const settingsSchema: SettingSchemaDesc[] = [
    {
        key: "youtubeInsertTitle",
        type: "boolean",
        default: true,
        title: "Insert Title",
        description: "Insert title",
    },
    {
        key: "youtubeInsertDuration",
        type: "boolean",
        default: true,
        title: "Insert Duration",
        description: "Insert duration",
    },
    {
        key: "youtubeInsertDescription",
        type: "boolean",
        default: true,
        title: "Insert Description",
        description: "Insert description",
    },
    {
        key: "youtubeInsertCaptions",
        type: "boolean",
        default: false,
        title: "Insert Captions",
        description: "Insert default closed-captions",
    },
]


function main() {
    logseq.useSettingsSchema(settingsSchema);

    logseq.Editor.registerSlashCommand(
        'YouTubeParse',
        async () => {
                await logseq.Editor.insertAtEditingCursor("You called YouTube Parse")
        },
    )


    logseq.Editor.registerSlashCommand(
        'YouTubeEmbed',
        async () => {
                await logseq.Editor.insertAtEditingCursor("You called YouTube Embed")
        },
    )


    logseq.Editor.registerSlashCommand(
        'YouTubeArchive',
        async () => {
                await logseq.Editor.insertAtEditingCursor("You called YouTube Archive")
        },
    )

    const insert_title = logseq.settings!["youtubeInsertTitle"]
    const insert_duration = logseq.settings!["youtubeInsertDuration"]
    const insert_description = logseq.settings!["youtubeInsertDescription"]
    const insert_captions = logseq.settings!["youtubeInsertCaptions"]
    
    console.info(`logseq-openweather-plugin: preference: insert_title -> ${insert_title} `)
    console.info(`logseq-openweather-plugin: preference: insert_duration -> ${insert_duration} `)
    console.info(`logseq-openweather-plugin: preference: insert_description -> ${insert_description} `)
    console.info(`logseq-openweather-plugin: preference: insert_captions -> ${insert_captions} `)

    console.info("logseq-openweather-plugin loaded")

}

function display_error(e) {
    console.error(e)
    logseq.Editor.insertAtEditingCursor(e)
}

logseq.ready(main).catch(display_error)
