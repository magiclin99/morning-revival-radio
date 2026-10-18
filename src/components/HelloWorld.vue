<template>
  <v-container>
    <v-select
      v-model="selectedYear"
      :items="years"
      @update:model-value="onYearChange"
    />

    <v-select
      v-model="selectedMessage"
      :items="messages"
      @update:model-value="onMessageChange"
    />

    <div class="d-flex align-start ga-2">
      <v-select
        v-model="selectedWeek"
        class="flex-grow-1"
        :items="weeks"
        label="Select Week"
        style="min-width: 0"
        @update:model-value="onWeekChange"
      />
      <v-btn
        v-if="outlineUrl"
        height="56"
        :href="outlineUrl"
        prepend-icon="mdi-text-box-outline"
        size="large"
        variant="tonal"
      >綱要</v-btn>
    </div>

    <v-list lines="two">
      <div v-for="(audio, index) in playableContents" :key="index">
        <v-list-item @click="playAudio(audio.link, audio.title)">
          <v-list-item-content>{{ audio.title }}</v-list-item-content>
        </v-list-item>
        <v-divider />
      </div>
    </v-list>
  </v-container>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import db from './db.json'

  interface PlayableContent {
    title: string;
    link: string;
  }

  interface WeeklyContents {
    [key: string]: PlayableContent[];
  }

  interface MessageContents {
    [key: string]: {
      weekList: string[];
      weeklyContents: WeeklyContents;
    };
  }

  interface YearContents {
    [key: string]: {
      messageList: string[];
      messageContents: MessageContents;
    };
  }

  interface DB {
    yearList: string[];
    yearContents: YearContents;
  }

  export default defineComponent({
    name: 'AudioPlayerComponent',
    data () {
      return {
        db: {} as DB,
        selectedYear: '',
        years: [] as string[],
        messages: [] as string[],
        selectedMessage: '',
        playableContents: [] as PlayableContent[],
        weeks: [] as string[],
        selectedWeek: '',
        outlines: {} as Record<string, string>,
      }
    },
    computed: {
      // 用音檔路徑（如 2026/5-Fall-Elders/week1）查 public/outlines/index.json；週標題的用字和綱要網頁不一致，不能拿來比對
      outlineUrl (): string {
        for (const { link } of this.playableContents ?? []) {
          const m = link.match(/7-Morning_Revival\/(\d{4}\/[^/]+)\/week(\d+)/)
          const path = m && this.outlines[`${m[1]}/week${m[2]}`]
          if (path) return import.meta.env.BASE_URL + path
        }
        return ''
      },
    },
    mounted () {
      fetch(import.meta.env.BASE_URL + 'outlines/index.json')
        .then(res => res.ok ? res.json() : {})
        .then(outlines => { this.outlines = outlines })
        .catch(() => {})

      this.db = db
      this.years = this.db.yearList
      this.selectedYear = this.years[0]

      const previousYear = localStorage.getItem('selectedYear')
      const previousMessage = localStorage.getItem('selectedMessage')
      const previousWeek = localStorage.getItem('selectedWeek')
      if (previousYear && previousMessage && previousWeek) {
        this.selectedYear = previousYear
        this.onYearChange()
        this.selectedMessage = previousMessage
        this.onMessageChange()
        this.selectedWeek = previousWeek
        this.onWeekChange()
      } else {
        this.onYearChange()
      }
    },
    methods: {
      onYearChange () {
        localStorage.setItem('selectedYear', this.selectedYear)
        this.messages = this.db.yearContents[this.selectedYear].messageList
        this.selectedMessage = this.messages[0]
        this.onMessageChange()
      },
      onMessageChange () {
        localStorage.setItem('selectedMessage', this.selectedMessage)
        this.weeks = this.db.yearContents[this.selectedYear].messageContents[this.selectedMessage].weekList
        this.selectedWeek = this.weeks[0]

        this.onWeekChange()
      },
      onWeekChange () {
        localStorage.setItem('selectedWeek', this.selectedWeek)
        this.playableContents = this.db.yearContents[this.selectedYear]
          .messageContents[this.selectedMessage]
          .weeklyContents[this.selectedWeek]
      },
      playAudio (uri: string, title: string) {
        // open uri in new tab
        window.location.href = `./play?file=${uri}&msgTitle=${this.selectedWeek}&fileTitle=${title}`
      },
    },
  })
</script>

<style scoped>
/* Add your styles here */
</style>
