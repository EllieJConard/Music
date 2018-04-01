import { 
  ControllerMidiEvent, 
  controlChangeEvents 
} from "midi/MidiEvent"

/**

RPN コントローラーイベントをひとつのイベントオブジェクトとしてまとめる

RPN は種類、値を表す2～4つのイベントからなるが、
バラバラになると正しく動作しないので、
読み込み時にひとつにまとめ、再生・保存時に元に戻す

*/
export function assemble(events: ControllerMidiEvent[]) {
  const result = []

  // ひとつにまとめた RPN イベントを作成する
  function createCC(rpnMSB, rpnLSB, dataMSB?, dataLSB?) {
    return {
      channel: rpnMSB.channel,
      type: "channel",
      subtype: "rpn",
      tick: rpnMSB.tick,
      deltaTime: rpnMSB.deltaTime,
      rpnMSB: rpnMSB.value,
      rpnLSB: rpnLSB.value,
      dataMSB: dataMSB ? dataMSB.value : undefined,
      dataLSB: dataLSB ? dataLSB.value : undefined
    }
  }

  function isCC(e, type) { return e && e.subtype === "controller" && e.controllerType === type }
  function isRPNMSB(e) { return isCC(e, 101) }
  function isRPNLSB(e) { return isCC(e, 100) }
  function isDataMSB(e) { return isCC(e, 6) }
  function isDataLSB(e) { return isCC(e, 38) }

  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    if (isRPNMSB(e)) {
      const j = i
      const data: ControllerMidiEvent[] = [e]
      const getNextIf = (event, test) => {
        if (test(event)) {
          i++ // skip this event
          return event
        }
        return null
      }
      result.push(createCC(
        e, 
        getNextIf(events[j + 1], isRPNLSB), 
        getNextIf(events[j + 2], isDataMSB), 
        getNextIf(events[j + 3], isDataLSB)
      ))
    } else {
      result.push(e)
    }
  }
  return result
}

export function deassemble(e) {
  if (e.subtype === "rpn") {
    return controlChangeEvents(e.deltaTime, e.rpnMSB, e.rpnLSB, e.dataMSB, e.dataLSB).map(c => ({
      ...c,
      channel: e.channel,
      tick: e.tick
    }))
  }
  return [e]
}