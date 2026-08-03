<template>
  <v-container>
    <div class="d-flex justify-end mb-2">
      <v-chip
        color="green"
        prepend-icon="mdi-headphones"
        size="small"
        variant="tonal"
      >
        同時收聽 {{ listenerCount }} 人
      </v-chip>
    </div>

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

    <v-select
      v-model="selectedWeek"
      :items="weeks"
      label="Select Week"
      @update:model-value="onWeekChange"
    />

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
  import { usePresence } from '@/composables/usePresence'

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
    setup () {
      // Browse page only observes the count; it does not register as a listener.
      const { listenerCount } = usePresence()
      return { listenerCount }
    },
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
      }
    },
    mounted () {
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
