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

    <v-select
      v-model="selectedWeek"
      :items="weeks"
      label="Select Week"
      @update:model-value="onWeekChange"
    />

    <v-list lines="two">
      <div v-for="(audio, index) in playableContents" :key="index">
        <v-list-item @click="playAudio(audio.link)">
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
    title: string
    link: string
  }

  interface WeekContent {
    key: string[]
    array: any
  }

  export default defineComponent({
    name: 'AudioPlayerComponent',
    data () {
      return {
        selectedYear: '',
        years: [] as string[],
        messages: [] as string[],
        selectedMessage: '',
        weekContent: {} as WeekContent,
        playableContents: [] as PlayableContent[],
        trainings: [] as string[],
        trainingData: {} as Record<string, any>,
        weeks: [] as string[],
        audioFiles: [] as { title: string; uri: string }[],
        selectedTraining: '',
        selectedWeek: '',
      }
    },
    mounted () {
      this.years = db.yearList
      this.selectedYear = this.years[0]
      this.onYearChange()
    },
    methods: {
      onYearChange () {
        this.messages = db.yearContents[this.selectedYear].messageList
        this.selectedMessage = this.messages[0]
        this.onMessageChange()
      },
      onMessageChange () {
        this.weeks = db.yearContents[this.selectedYear].messageContents[this.selectedMessage].weekList
        this.selectedWeek = this.weeks[0]

        this.onWeekChange()
      },
      onWeekChange () {
        const yearlyContent = db.yearContents[this.selectedYear]
        this.playableContents = yearlyContent
          .messageContents[this.selectedMessage]
          .weeklyContents[this.selectedWeek]
      },
      playAudio (uri: string) {
        // open uri in new tab
        window.open(uri, '_blank')
      },
    },
  })
</script>

<style scoped>
/* Add your styles here */
</style>
