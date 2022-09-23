import '@logseq/libs';
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
import getYouTubeID from 'get-youtube-id';
import { YouTube } from 'popyt';

const settingsSchema: SettingSchemaDesc[] = [
    {
        key: "youtubeAPIKey",
        type: "string",
        default: "",
        title: "API Key",
        description: "Get yours at: https://console.cloud.google.com/apis/api/youtube.googleapis.com/credentials",
    },
    {
        key: "youtubeSlashCommand",
        type: "string",
        default: "Parse YouTube URL",
        title: "Slash Command",
        description: "Preferred name for slash command (default: Parse YouTube URL)",
    },
    {
        key: "youtubeEmbedVideo",
        type: "boolean",
        default: true,
        title: "Embed Video",
        description: "Embed video as a child block",
    },
    {
        key: "youtubeEmbedThumbnail",
        type: "boolean",
        default: false,
        title: "Embed Thumbnail",
        description: "Embed Thumbnail as a child block",
    },
    {
        key: "youtubeIncludeMetadataAsBlock",
        type: "boolean",
        default: false,
        title: "Include Metadata as block",
        description: "Metadata as block properties on a child block",
    },
    {
        key: "youtubeIncludeTagsAsBlock",
        type: "boolean",
        default: true,
        title: "Include Tags as block",
        description: "Tags (if available) as a child block",
    },
    {
        key: "youtubeIncludeDescription",
        type: "boolean",
        default: true,
        title: "Include Description",
        description: "Description as a child block",
    },
    // Disabled configuration to include metadata as properties as they are not being parsed properly.
    // {
    //     key: "youtubeIncludeMetadataAsProperties",
    //     type: "boolean",
    //     default: false,
    //     title: "Include Metadata as properties",
    //     description: "Metadata as block properties",
    // },
    // {
    //     key: "youtubeIncludeTagsAsProperty",
    //     type: "boolean",
    //     default: false,
    //     title: "Include Tags as property",
    //     description: "Tags (if available) as block property",
    // },
]

function getYouTubeURL(YouTubeID: string) {
    return `https://www.youtube.com/watch?v=${YouTubeID}`
}

function getYouTubeTags(data: object) {
    var tags: string[]
    if (data["tags"]) { tags = data['tags'].map((t: string) => `#[[${t}]]`) } else { tags = []}
    return tags
}

function getYouTubeThumbnail(data: object) {
    var thumbnail: string
    if (data["thumbnails"]["high"] && data["thumbnails"]["high"]["url"]) {
        thumbnail = data["thumbnails"]["high"]["url"]
    } else if (data["thumbnails"]["default"] && data["thumbnails"]["default"]["url"]) {
        thumbnail = data["thumbnails"]["default"]["url"]
    } else {
        thumbnail = ""
    }
    return thumbnail
}

function reformatSourceBlock(text: string, title: string, link: string): string {
    var regex = /((http|https|ftp):\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g
    const new_text = text.replace(regex, `[${title}](${link})`)
    return new_text
}

function formatMetadataAsProperties(link: string, data: object, tags: string[], include_tags_as_props: boolean) {
    if (include_tags_as_props) {
        return `\n\
title:: ${data["title"]}\n\
channel:: [[${data['channel']['name']}]]\n\
type:: youtube/video\n\
tags:: ${tags.join(' ')}\n\
link:: ${link}\n\
`
    } else {
        return `\n\
title:: ${data["title"]}\n\
channel:: [[${data['channel']['name']}]]\n\
type:: youtube/video\n\
link:: ${link}\n\
`       
    }
}

async function main() {
    logseq.useSettingsSchema(settingsSchema);
    const YOUTUBE_API_KEY = logseq.settings!["youtubeAPIKey"]
    const YOUTUBE_SLASH_COMMAND = logseq.settings!["youtubeSlashCommand"] ?? "Parse YouTube URL"
    if (!YOUTUBE_API_KEY) {
        logseq.App.showMsg('YouTube API Key required. Please configure in plugin settings.', 'error')
        return
    }
    if (!YOUTUBE_SLASH_COMMAND) {
        logseq.App.showMsg('YouTube Slash Command required. Please configure in plugin settings.', 'error')
        return
    }
    const youtube = new YouTube(YOUTUBE_API_KEY);

    logseq.Editor.registerSlashCommand(
        YOUTUBE_SLASH_COMMAND,
        async () => {
            let current_block = await logseq.Editor.getCurrentBlock()
            let include_metadata_as_props = logseq.settings!["youtubeIncludeMetadataAsProperties"] ?? false
            let include_metadata_as_block = logseq.settings!["youtubeIncludeMetadataAsBlock"]
            let include_tags_as_props = logseq.settings!["youtubeIncludeTagsAsProperty"] ?? false
            let include_tags_as_block = logseq.settings!["youtubeIncludeTagsAsBlock"]
            let include_description = logseq.settings!["youtubeIncludeDescription"]
            let embed_thumbnail = logseq.settings!["youtubeEmbedThumbnail"]
            let embed_video = logseq.settings!["youtubeEmbedVideo"]

            if (current_block) {
                let current_text = await logseq.Editor.getEditingBlockContent()
                if (current_text) {
                    let youtube_id = getYouTubeID(current_text)
                    if (youtube_id) {
                        let link = getYouTubeURL(youtube_id)
                        await logseq.Editor.updateBlock(current_block.uuid, `${getYouTubeURL(youtube_id)} | Fetching...`)
                        await youtube.getVideo(youtube_id).then(async (data) => {
                            console.log(data);
                            let title = data["title"]
                            let tags = getYouTubeTags(data)
                            let thumbnail = getYouTubeThumbnail(data)
                            let block_properties = formatMetadataAsProperties(link, data, tags, include_tags_as_props)
                            let formatted_text = reformatSourceBlock(current_text, title, link)
                            var blocks: string[] = []

                            if (embed_thumbnail) { blocks.push(`![thumbnail](${thumbnail})`) }
                            if (embed_video) { blocks.push(`{{video ${link}}}`) }
                            if (include_metadata_as_block) { blocks.push(`${block_properties}`) }
                            if (include_tags_as_block && tags.length > 0) { blocks.push(`${tags.join(" ")}`) }
                            if (include_description && data['description'] != "") { blocks.push(`${data['description']}`) }
                            if (include_metadata_as_props) {
                                // include_metadata_as_props is false until properties added here are parsed correctly
                                await logseq.Editor.updateBlock(current_block!.uuid, formatted_text + "\n" + block_properties)
                            } else {
                                await logseq.Editor.updateBlock(current_block!.uuid, formatted_text)                           
                            }
                            if (include_tags_as_props && tags.length > 0) {
                                // include_tags_as_props is false until properties added here are parsed correctly
                                await logseq.Editor.upsertBlockProperty(current_block!, 'tags', tags.join(' '))
                            }

                            let batch_blocks = blocks.map(it => ({ content: it }))
                            if (blocks.length > 0) {
                                await logseq.Editor.insertBatchBlock(current_block!.uuid, batch_blocks, {sibling: false})
                            }
                        }, async (err) => {
                            console.error(err);
                            await logseq.Editor.updateBlock(current_block!.uuid, current_text)
                            logseq.App.showMsg('YouTube API returned an error', "error")
                        })
                    } else { logseq.App.showMsg('Could not find any YouTube Video URLs in current block.', 'error') }
                } else { logseq.App.showMsg('Could not get current block\'s content.', 'error') }
            } else { logseq.App.showMsg('Could not get current block.', 'error') }
        })
    console.info("logseq-youtube-plugin loaded")

}

function display_error(e) {
    console.error(e)
    logseq.Editor.insertAtEditingCursor(e)
}

logseq.ready(main).catch(display_error)
