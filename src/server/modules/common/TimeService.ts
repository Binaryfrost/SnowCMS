import { getAllTimezones } from 'countries-and-timezones';
import { IANAZone } from 'luxon';
import Service from '../Service';

export default class TimeService extends Service {
  private timezones!: string[];

  timestampSec() {
    return Math.floor(Date.now() / 1000);
  }

  getTimezones() {
    if (this.timezones) return this.timezones;

    const ALL_TIMEZONES = Object.keys(getAllTimezones())
      .filter((e) => e === 'Etc/UTC' || (e.includes('/') && !e.startsWith('Etc/')));

    this.timezones = ALL_TIMEZONES
      .filter((e) => {
        if (IANAZone.isValidZone(e)) {
          return true;
        }

        console.warn(`Unsupported timezone: ${e}`);
        return false;
      });

    console.log(`Loaded ${this.timezones.length}/${ALL_TIMEZONES.length} timezones`);
    return this.timezones;
  }
}
