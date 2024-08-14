import { IValueArea } from './valueArea.types'
import { IInitialBalance, IVolumeProfileObservation } from './volumeProfile.types'

export interface IMarketProfile {
  valueArea?: IValueArea
  IB?: IInitialBalance
  failedAuction?: IVolumeProfileObservation[]
  excess?: IVolumeProfileObservation[]
  poorHighLow?: IVolumeProfileObservation[]
  singlePrints?: IVolumeProfileObservation[]
  ledges?: IVolumeProfileObservation[]
}
