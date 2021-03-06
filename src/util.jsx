import React from 'react';
import Formatter from 'uxcore-formatter';
import Tooltip from 'uxcore-tooltip';
import classnames from 'classnames';
import moment from 'moment';
import sortBy from 'lodash/sortBy';
import i18n from './locale';


/**
 * code should be an object like this {'xxxx-xx-xx': 'work/leave/schedule'}
 */
const generateContentRender = (str, lang = 'zh-cn') => function contentRender(code, locale, current) {
  // see https://github.com/yiminghe/gregorian-calendar to get details about `current` API
  const time = current.getTime();
  const date = Formatter.date(time, 'YYYY-MM-DD');
  let type = code[date];
  if (typeof type === 'string') {
    type = [type];
  } else if (type === undefined) {
    type = [];
  }
  const tipMap = i18n[locale];
  const content = [];
  const isWork = type.indexOf('work') !== -1;
  const isLeave = type.indexOf('leave') !== -1;
  const isSchedule = type.indexOf('schedule') !== -1;

  content.push(
    <span
      key="date"
      className={classnames({
        'kuma-calendar-date-content': true,
        work: isWork,
        leave: isLeave,
        schedule: isSchedule,
      })}
    >
      {current.getDayOfMonth()}
    </span>,
  );
  if (isSchedule) {
    content.push(<span key="bottom-line" className="kuma-calendar-date-decoration" />);
  }
  if (isWork || isLeave) {
    return (
      <Tooltip placement="right" trigger={['hover']} overlay={tipMap[isWork ? 'work' : 'leave']}>
        <div className="kuma-calendar-date-content-box">
          {content}
        </div>
      </Tooltip>
    );
  }
  // only one child can be passed.
  return (
    <div className="kuma-calendar-date-content-box">
      {content}
    </div>
  );
}.bind(null, str, lang);

function getCalendarContainer() {
  const c = document.createElement('div');
  c.className = 'uxcore';
  document.body.appendChild(c);
  return c;
}

/**
 * for forward compatability
 */
function generalizeFormat(format) {
  return format.replace(/y|d/g, value => value.toUpperCase());
}
function getTime(props) {
  const { startHour, value } = props;
  const newStartHour = startHour ? parseInt(startHour, 10) : 9;
  return moment(value)
    .hour(newStartHour)
    .minute(0);
}
function getTimeLine(props, current) {
  const { prefixCls, step } = props;
  let hour = moment(current).hour();
  let minute = moment(current).minute() || 0;
  hour = hour > 9 ? hour : `0${hour}`;
  minute = minute > 9 ? minute : `0${minute}`;
  const prefixTime = hour > 12 ? 'pm' : 'am';
  let selected = hour === moment().hour();
  selected = selected && moment().minute() >= parseInt(minute, 10);
  selected = selected && moment().minute() < step + parseInt(minute, 10);

  return (
    <td className={`${prefixCls}-time-panel`} key={current}>
      <div
        className={classnames({
          [`${prefixCls}-timeline-now`]: selected,
        })}
        key={current}
      >
        <div className="cell-number">
          {`${hour}:${minute} ${prefixTime}`}
        </div>
      </div>
    </td>
  );
}

function sortByRender(events) {
  return sortBy(events, e => moment(e.start).valueOf());
}
function getMomentValue(date, hour) {
  return moment(date)
    .hour(hour)
    .minute(0)
    .second(0)
    .valueOf();
}
/**
 * is in same row
 */
function inSameRow(target, source) {
  if (!target || !source) {
    return false;
  }
  const isLt = moment(source.start).isBefore(moment(source.start))
    && moment(source.start).isAfter(moment(target.end));
  const isEq = moment(source.start).isSame(moment(source.start))
    && moment(source.end).isSame(moment(source.end));
  return isLt || isEq;
}
/**
 * 获取当前日期在月面板的第几行
 */
function getDiffTop(start) {
  const firstDateOfMonth = moment(+new Date(start)).startOf('month');
  const diffDate = firstDateOfMonth.day();
  const firstDayOfMonthPanel = firstDateOfMonth.subtract(diffDate - 1).date()
    - moment(start).date();
  return Math.floor(Math.abs(firstDayOfMonthPanel) / 7);
}

/**
 * evaluate style of events
 *
 */
function isSameMoment(target, source) {
  const newTarget = moment(target).format('YYYY-MM-DD');
  const newSource = moment(source).format('YYYY-MM-DD');
  return moment(newTarget).isSame(newSource);
}
/**
 * 获取是否处于当前面板中
 */
function isInCurrentPanle(event, opts) {
  const { current, type } = opts;
  const { start, end } = event;
  if (moment(end).valueOf() - moment(start).valueOf() < 0) {
    return false;
  }
  if (type === 'time') {
    return isSameMoment(current, start);
  }
  if (type === 'week') {
    let day = moment(current).day();
    day = day === 0 ? 7 : day;
    const firstDate = moment(current).subtract(day, 'd');
    const lastDate = moment(current).add(7 - day, 'd');
    return moment(start).isBetween(firstDate, lastDate);
  }
  return moment(start).isSame(current, 'month');
}
/**
 * handle events is overlap
 *
 */
function handleEvents(events) {
  const containerEvents = [];
  const wraperHtml = {};
  for (let i = 0, len = events.length; i < len; i++) {
    const event = events[i];
    const { start, end, isColspan } = event;
    const startKey = moment(start).format('YYYY-MM-DD');
    const endKey = moment(end).format('YYYY-MM-DD');
    const monthTop = isColspan ? getDiffTop(start) : `${startKey}~${endKey}`;
    if (!wraperHtml[monthTop]) {
      wraperHtml[monthTop] = {
        children: [],
        date: startKey,
        end,
        isColspan,
        monthTop,
        isContainer: true,
      };
    }
    wraperHtml[monthTop].children.push(event);
    const container = containerEvents.find(c => moment(c.end).valueOf() >= moment(start).valueOf());

    // has overlap，this event will be a container to contain next event
    if (!container) {
      event.rows = [];
      containerEvents.push(event);
    } else {
      // 找到evet的容器
      event.container = container;
      let row = null;
      for (let r = container.rows.length - 1; !row && r >= 0; r--) {
        if (inSameRow(event, container.rows[r])) {
          row = container.rows[r];
        }
      }
      if (row) {
        row.leaves.push(event);
        event.row = row;
      } else {
        event.leaves = [];
        container.rows.push(event);
      }
    }
  }
  return wraperHtml;
}

function computeEventStyle(event, type, current) {
  const start = event.start || event.date;
  const {
    end, isColspan, monthTop, children,
  } = event;
  const isSameDate = moment(event.end).isSame(current, 'd');
  const topDiff = isSameDate ? 0.06 : 0.05;
  let startDate = moment(start).day();
  startDate = startDate === 0 ? 7 : startDate;
  let widthSlice = 1;
  let offsetx = 0;
  if (type !== 'time' && (children || isColspan)) {
    widthSlice = 7;
    const diffEvent = moment(end).date() - moment(start).date() + 1;
    offsetx = (startDate - 1) / 7;
    const top = !Number.isNaN(Number(monthTop)) ? monthTop : getDiffTop(start);
    return {
      width: (children && isColspan)
        ? 1 - 0.015 : (1 / widthSlice) * diffEvent - 0.015,
      offsetX: (children && isColspan) ? 0 : offsetx + 0.005,
      top: type === 'month' ? top / 6 + topDiff : 0,
    };
  }
  if ((!event.rows || !event.rows.length) && !event.container) {
    return { width: 1 / widthSlice - 0.015, offsetX: offsetx + 0.005 };
  }
  if (type === 'month') return {};

  if (event.rows) {
    const columns = event.rows.reduce((max, row) => Math.max(max, row.leaves.length + 1), 0) + 1;
    return { width: 1 / (columns * widthSlice) - 0.01, offsetX: offsetx };
  }

  if (event.leaves) {
    const avaliableWidth = 1 / widthSlice - event.container.width;
    const otherWidth = avaliableWidth / (event.leaves.length + 1) - 0.01;
    offsetx = otherWidth + event.container.offsetX + 0.01;
    return { width: otherWidth, offsetX: offsetx };
  }

  const { leaves, offsetX } = event.row;
  const idx = leaves.indexOf(event);
  return {
    width: event.row.width - 0.01,
    offsetX: event.row.width * (idx + 1) + offsetX + 0.01,
  };
}

/**
 * 拆分月面板事件
 *
 */
function splitMonthEvents(event, diffDays, hasColspan) {
  const arrs = [];
  const { start, end, render } = event;
  const startDay = moment(start).day();
  const eStart = moment(start).valueOf();
  const eEnd = moment(end).valueOf();
  // 是否在一行
  if (startDay + diffDays > 7) {
    const splitDays = Math.ceil(Math.abs(7 - (startDay + diffDays)) / 7);
    for (let i = 0; i <= splitDays; i++) {
      const startTime = i === 0 ? start : moment(eStart).add(8 - startDay + 7 * (i - 1), 'd');
      const endTime = i === splitDays ? end : moment(eStart).add(7 - startDay + 7 * i, 'd');
      hasColspan.count += 1;
      arrs.push({
        start: startTime,
        end: endTime,
        render,
        eStart,
        eEnd,
        isColspan: true,
      });
    }
  } else {
    if (diffDays >= 1) {
      hasColspan.count += 1;
    }
    arrs.push({
      start,
      end,
      render,
      eStart,
      eEnd,
      isColspan: diffDays >= 1,
    });
  }

  return arrs;
}

function getCorrectEventsDate(event, opts) {
  const { startHour, endHour } = opts;
  const { start, end } = event;
  const eHour = moment(end).hour();
  const newEnd = eHour > endHour ? moment(end).hour(endHour) : end;
  const sHour = moment(start).hour();
  const newStart = sHour < startHour ? moment(start).hour(startHour) : start;
  return {
    newEnd, newStart,
  };
}
/**
 * 拆分事件，是否为跨天事件
 */
function splitEvents(event, diffDays, opts, hasColspan) {
  const arrs = [];
  const { startHour, endHour, type } = opts;
  const { start, end, render } = event;
  if (type === 'month') {
    return splitMonthEvents(event, diffDays, hasColspan);
  }
  const { newStart, newEnd } = getCorrectEventsDate(event, opts);

  const eStart = moment(start).valueOf();
  const eEnd = moment(end).valueOf();

  for (let i = 0; i <= diffDays; i++) {
    const startTime = i === 0
      ? newStart
      : moment(eStart)
        .add(i, 'd')
        .hour(startHour)
        .minute(0);


    const endTime = i === diffDays
      ? newEnd
      : moment(startTime)
        .hour(endHour)
        .minute(0);

    arrs.push({
      start: startTime,
      end: endTime,
      render,
      eStart,
      eEnd,
    });
  }

  return arrs;
}

function initEvents(events, opts, hasColspan) {
  let resultEvents = [];
  events.forEach((event) => {
    const { start, end } = event;
    const diffDate = moment(end).diff(moment(start), 'days');
    if (diffDate > 0) {
      resultEvents = resultEvents.concat(splitEvents(event, diffDate, opts, hasColspan));
    } else {
      const { newStart, newEnd } = getCorrectEventsDate(event, opts);
      event.start = newStart;
      event.end = newEnd;
      resultEvents.push(event);
    }
  });

  return resultEvents;
}
function getEventTopHeight(event, opts, sourceDate) {
  const {
    startHour, current, slicePiece, step, type,
  } = opts;
  const { start } = event;
  const { sourceStart, sourceEnd } = sourceDate;
  let startCurrent = getMomentValue(current, startHour);
  const totalSeconds = (slicePiece + 2) * step * 60 * 1000;
  let evetTop;
  let eventHeight;
  if (type === 'time') {
    const diffStartCurrent = sourceStart - startCurrent + step * 60 * 1000;
    const diffEventHeight = sourceEnd - sourceStart;
    evetTop = diffStartCurrent / totalSeconds + 0.01;
    eventHeight = diffEventHeight / totalSeconds - 0.015;
    return { top: evetTop, height: eventHeight };
  }
  if (type === 'week') {
    startCurrent = getMomentValue(start, startHour);
    const diffStartCurrent = sourceStart - startCurrent + step * 60 * 1000;
    const diffEventHeight = sourceEnd - sourceStart;
    evetTop = diffStartCurrent / totalSeconds + 0.01;
    eventHeight = diffEventHeight / totalSeconds - 0.015;
    return { top: evetTop, height: eventHeight };
  }
  return { top: 0, height: 0 };
}
function handleEventsInSameDate(eventsContainer, opts) {
  const { current, type } = opts;
  const events = eventsContainer.children;
  const rangeEvents = [];

  events.forEach((event) => {
    const { start, end } = event;
    const eStart = moment(start).valueOf();
    const eEnd = moment(end).valueOf();
    const sourceDate = { sourceStart: eStart, sourceEnd: eEnd };
    if (isInCurrentPanle(event, opts)) {
      // 获取事件的top值和高度
      const { top, height } = getEventTopHeight(event, opts, sourceDate);
      const { width, offsetX } = computeEventStyle(event, type, current);
      let evetObj = {};
      if (!Number.isNaN(Number(width)) && !Number.isNaN(Number(offsetX))) {
        event.width = width;
        event.offsetX = offsetX;
        evetObj = {
          event,
          top,
          height,
          width,
          offsetX,
        };
      } else {
        evetObj = {
          event,
        };
      }
      rangeEvents.push(evetObj);
    }
  });

  return rangeEvents;
}

function evaluateStyle(events, opts, hasColspan) {
  // 拆分事件，为week时，跨两天拆分为两天
  const { type, current } = opts;
  const newEvents = initEvents(events, opts, hasColspan);
  // 对事件进行排序
  const sortedEvents = sortByRender(newEvents);
  // 获取同一段事件的容器位置
  const containerEvents = handleEvents(sortedEvents, opts);
  const containerEventsKeys = Object.keys(containerEvents);
  containerEventsKeys.forEach((key) => {
    const wrapSchedule = containerEvents[key];
    const containerStyle = computeEventStyle(wrapSchedule, type, current);
    wrapSchedule.top = containerStyle.top;
    wrapSchedule.width = containerStyle.width;
    wrapSchedule.offsetX = containerStyle.offsetX;
    wrapSchedule.height = type === 'month' ? 1 / 6 - 0.05 : 1;
    containerEvents[key].children = handleEventsInSameDate(wrapSchedule, opts, containerEvents);
  });

  return containerEvents;
}

/**
 * generate schedule content
 * @param
 * ({
 *  start: '2018-11-12 12:00',
 *  end: '2018-11-12 14:00',
 *  render: function(){}
 * })
 */
const generateScheduleContent = (events) => {
  const hasColspan = { count: 0 };
  return function scheduleRender(evts, opts) {
    const containerEvents = evaluateStyle(evts, opts, hasColspan);
    const resultScheduleHtml = [];
    const eventsKeys = Object.keys(containerEvents);
    eventsKeys.forEach((key) => {
      const container = containerEvents[key];
      const {
        children: rangeEvents, width, offsetX, height, top, isColspan,
      } = container;
      // 如果有跨栏的，跨栏始终在上
      let notColspanHeight = height;
      notColspanHeight = notColspanHeight < 0.055 ? 0.055 : notColspanHeight;

      const containerStyle = {
        width: `${width * 100}%`,
        left: `${offsetX * 100}%`,
        top: top ? `${top * 100}%` : 0,
        height: `${notColspanHeight * 100}%`,
      };
      const containerCls = classnames({
        'cell-container': true,
        'colspan-cell': isColspan,
      });
      resultScheduleHtml.push(
        <div className={containerCls} key={container.end} style={containerStyle}>
          {rangeEvents.map((event, idx) => {
            const originEvt = event.event;
            const { start, render } = originEvt;
            const eStyle = {
              top: `${event.top * 100}%`,
              height: `${event.height * 100}%`,
              left: `${event.offsetX * 100}%`,
              width: `${event.width * 100}%`,
            };
            const content = render && typeof render === 'function' ? render(event) : moment(start).date();
            return (
              <div className="kuma-calendar-content-box" key={idx} style={eStyle}>
                <div className="kuma-calendar-content-wraper">
                  {content}
                </div>
              </div>
            );
          })}
        </div>,
      );
    });
    return resultScheduleHtml;
  }.bind(null, events);
};


export default {
  generateContentRender,
  generateScheduleContent,
  getCalendarContainer,
  generalizeFormat,
  getTime,
  getTimeLine,
};
