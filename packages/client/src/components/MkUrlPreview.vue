<template>
<div v-if="playerEnabled && player.url" class="player" :style="`padding: ${(player.height || 0) / (player.width || 1) * 100}% 0 0`">
    <button class="disablePlayer" :title="i18n.ts.disablePlayer" @click="playerEnabled = false"><i class="ti ti-x"></i></button>
    <iframe :src="player.url + (player.url.match(/\?/) ? '&autoplay=1&auto_play=1' : '?autoplay=1&auto_play=1')" :width="player.width || '100%'" :heigth="player.height || 250" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen/>
</div>
<div v-else v-size="{ max: [400, 350] }" class="mk-url-preview">
    <transition :name="$store.state.animation ? 'zoom' : ''" mode="out-in">
        <component :is="self ? 'MkA' : 'a'" v-if="!fetching" class="link" :class="{ compact }" :[attr]="maybeRelativeUrl" rel="nofollow noopener" :target="target" :title="url">
            <div v-if="thumbnail" class="thumbnail" :style="`background-image: url('${thumbnail}')`">
                <button v-if="!playerEnabled && player.url" class="_button" :title="i18n.ts.enablePlayer" @click.prevent="playerEnabled = true"><i class="ti ti-player-play"></i></button>
            </div>
            <article>
                <header>
                    <h1 :title="title ?? 'Untitled'">{{ title }}</h1>
                </header>
                <p v-if="description" :title="description">{{ description.length > 85 ? description.slice(0, 85) + '…' : description }}</p>
                <footer>
                    <img v-if="icon" class="icon" :src="icon"/>
                    <p :title="sitename ?? 'unknown'">{{ sitename }}</p>
                </footer>
            </article>
        </component>
    </transition>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from "vue";
import { url as local, lang } from "@/config";
import { i18n } from "@/i18n";
import { maybeMakeRelative } from "@/scripts/url";

const props = withDefaults(defineProps<{
	url: string;
	detail?: boolean;
	compact?: boolean;
}>(), {
    detail: false,
    compact: false,
});

const maybeRelativeUrl = maybeMakeRelative(props.url, local);
const self = maybeRelativeUrl !== props.url;
const attr = self ? "to" : "href";
const target = self ? null : "_blank";
const fetching = ref(true);
const title = ref<string | null>(null);
const description = ref<string | null>(null);
const thumbnail = ref<string | null>(null);
const icon = ref<string | null>(null);
const sitename = ref<string | null>(null);
const player = ref({
    url: null,
    width: null,
    height: null,
} as {
    url: string | null;
    width: number | null;
    height: number | null;
});
const playerEnabled = ref(false);
const tweetId = ref<string | null>(null);
const tweetHeight = ref<number | null>(null);

const embedId = `embed${Math.random().toString().replace(/\D/,"")}`;

const requestUrl = new URL(props.url);

if (requestUrl.hostname === "twitter.com" || requestUrl.hostname === "mobile.twitter.com") {
    const m = requestUrl.pathname.match(/^\/.+\/status(?:es)?\/(\d+)/);
    if (m) tweetId.value = m[1];
}

if (requestUrl.hostname === "music.youtube.com" && requestUrl.pathname.match("^/(?:watch|channel)")) {
    requestUrl.hostname = "www.youtube.com";
}

const requestLang = (lang || "ja-JP").replace("ja-KS", "ja-JP");

requestUrl.hash = "";

fetch(`/url?url=${encodeURIComponent(requestUrl.href)}&lang=${requestLang}`).then(res => {
    res.json().then(info => {
        if (info.url == null) return;
        title.value = info.title;
        description.value = info.description;
        thumbnail.value = info.thumbnail;
        icon.value = info.icon;
        sitename.value = info.sitename;
        fetching.value = false;
        player.value = info.player;
    });
});

function adjustTweetHeight(message: any) {
    if (message.origin !== "https://platform.twitter.com") return;
    const embed = message.data?.["twttr.embed"];
    if (embed?.method !== "twttr.private.resize") return;
    if (embed?.id !== embedId) return;
    const height = embed?.params[0]?.height;
    if (height) tweetHeight.value = height;
}

(window as any).addEventListener("message", adjustTweetHeight);

onUnmounted(() => {
    (window as any).removeEventListener("message", adjustTweetHeight);
});
</script>

<style lang="scss" scoped>
.player {
	position: relative;
	width: 100%;

	> button {
		position: absolute;
		top: -1.5em;
		right: 0;
		font-size: 1em;
		width: 1.5em;
		height: 1.5em;
		padding: 0;
		margin: 0;
		color: var(--fg);
		background: rgba(128, 128, 128, 0.2);
		opacity: 0.7;

		&:hover {
			opacity: 0.9;
		}
	}

	> iframe {
		height: 100%;
		left: 0;
		position: absolute;
		top: 0;
		width: 100%;
	}
}

.mk-url-preview {
	&.max-width_400px {
		> .link {
			font-size: 12px;

			> .thumbnail {
				height: 80px;
			}

			> article {
				padding: 12px;
			}
		}
	}

	&.max-width_350px {
		> .link {
			font-size: 10px;

			> .thumbnail {
				height: 70px;
			}

			> article {
				padding: 8px;

				> header {
					margin-bottom: 4px;
				}

				> footer {
					margin-top: 4px;

					> img {
						width: 12px;
						height: 12px;
					}
				}
			}

			&.compact {
				> .thumbnail {
					position: absolute;
					width: 56px;
					height: 100%;
				}

				> article {
					left: 56px;
					width: calc(100% - 56px);
					padding: 4px;

					> header {
						margin-bottom: 2px;
					}

					> footer {
						margin-top: 2px;
					}
				}
			}
		}
	}

	> .link {
		position: relative;
		display: block;
		font-size: 14px;
		box-shadow: 0 0 0 1px var(--divider);
		border-radius: 8px;
		overflow: hidden;

		&:hover {
			text-decoration: none;
			border-color: rgba(0, 0, 0, 0.2);

			> article > header > h1 {
				text-decoration: underline;
			}
		}

		> .thumbnail {
			position: absolute;
			width: 100px;
			height: 100%;
			background-position: center;
			background-size: cover;
			display: flex;
			justify-content: center;
			align-items: center;

			> button {
				font-size: 3.5em;
				opacity: 0.7;

				&:hover {
					font-size: 4em;
					opacity: 0.9;
				}
			}

			& + article {
				left: 100px;
				width: calc(100% - 100px);
			}
		}

		> article {
			position: relative;
			box-sizing: border-box;
			padding: 16px;

			> header {
				margin-bottom: 8px;

				> h1 {
					margin: 0;
					font-size: 1em;
				}
			}

			> p {
				margin: 0;
				font-size: 0.8em;
			}

			> footer {
				margin-top: 8px;
				height: 16px;

				> img {
					display: inline-block;
					width: 16px;
					height: 16px;
					margin-right: 4px;
					vertical-align: top;
				}

				> p {
					display: inline-block;
					margin: 0;
					color: var(--urlPreviewInfo);
					font-size: 0.8em;
					line-height: 16px;
					vertical-align: top;
				}
			}
		}

		&.compact {
			> article {
				> header h1, p, footer {
					overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;
				}
			}
		}
	}
}
</style>
