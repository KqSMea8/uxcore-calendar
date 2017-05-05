// customized rc-calendar https://github.com/react-component/calendar/blob/master/src/Calendar.jsx

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import CalendarMixin from 'rc-calendar/lib/mixin/CalendarMixin';
import CommonMixin from 'rc-calendar/lib/mixin/CommonMixin';
import DateInput from 'rc-calendar/lib/date/DateInput';
import { getTimeConfig, getTodayTime } from 'rc-calendar/lib/util/index';
import KeyCode from 'rc-util/lib/KeyCode';

import CalendarFooter from './CalendarFooter';
import CalendarHeader from './CalendarHeader';
import DateTable from './date/DateTable';

function noop() {
}

function goStartMonth() {
  const next = this.state.value.clone();
  next.startOf('month');
  this.setValue(next);
}

function goEndMonth() {
  const next = this.state.value.clone();
  next.endOf('month');
  this.setValue(next);
}

function goTime(direction, unit) {
  const next = this.state.value.clone();
  next.add(direction, unit);
  this.setValue(next);
}

function goMonth(direction) {
  return goTime.call(this, direction, 'months');
}

function goYear(direction) {
  return goTime.call(this, direction, 'years');
}

function goWeek(direction) {
  return goTime.call(this, direction, 'weeks');
}

function goDay(direction) {
  return goTime.call(this, direction, 'days');
}

const Calendar = React.createClass({
  propTypes: {
    disabledDate: PropTypes.func,
    disabledTime: PropTypes.any,
    value: PropTypes.object,
    selectedValue: PropTypes.object,
    defaultValue: PropTypes.object,
    className: PropTypes.string,
    locale: PropTypes.object,
    showWeekNumber: PropTypes.bool,
    style: PropTypes.object,
    showToday: PropTypes.bool,
    showDateInput: PropTypes.bool,
    visible: PropTypes.bool,
    onSelect: PropTypes.func,
    onOk: PropTypes.func,
    showOk: PropTypes.bool,
    prefixCls: PropTypes.string,
    onKeyDown: PropTypes.func,
    timePicker: PropTypes.element,
    dateInputPlaceholder: PropTypes.any,
    onClear: PropTypes.func,
    onChange: PropTypes.func,
    renderFooter: PropTypes.func,
    renderSidebar: PropTypes.func,
  },

  mixins: [CommonMixin, CalendarMixin],

  getDefaultProps() {
    return {
      showToday: true,
      showDateInput: true,
      timePicker: null,
      onOk: noop,
    };
  },
  getInitialState() {
    return {
      showTimePicker: true,
    };
  },
  onKeyDown(event) {
    if (event.target.nodeName.toLowerCase() === 'input') {
      return undefined;
    }
    const keyCode = event.keyCode;
    // mac
    const ctrlKey = event.ctrlKey || event.metaKey;
    switch (keyCode) {
      case KeyCode.DOWN:
        goWeek.call(this, 1);
        event.preventDefault();
        return 1;
      case KeyCode.UP:
        goWeek.call(this, -1);
        event.preventDefault();
        return 1;
      case KeyCode.LEFT:
        if (ctrlKey) {
          goYear.call(this, -1);
        } else {
          goDay.call(this, -1);
        }
        event.preventDefault();
        return 1;
      case KeyCode.RIGHT:
        if (ctrlKey) {
          goYear.call(this, 1);
        } else {
          goDay.call(this, 1);
        }
        event.preventDefault();
        return 1;
      case KeyCode.HOME:
        goStartMonth.call(this);
        event.preventDefault();
        return 1;
      case KeyCode.END:
        goEndMonth.call(this);
        event.preventDefault();
        return 1;
      case KeyCode.PAGE_DOWN:
        goMonth.call(this, 1);
        event.preventDefault();
        return 1;
      case KeyCode.PAGE_UP:
        goMonth.call(this, -1);
        event.preventDefault();
        return 1;
      case KeyCode.ENTER:
        this.onSelect(this.state.value, {
          source: 'keyboard',
        });
        event.preventDefault();
        return 1;
      default:
        this.props.onKeyDown(event);
        return 1;
    }
  },

  onClear() {
    this.onSelect(null);
    this.props.onClear();
  },

  onOk() {
    const { selectedValue } = this.state;
    this.onSelect(selectedValue, {
      source: 'keyboard',
    });
  },

  onDateInputChange(value) {
    this.onSelect(value, {
      source: 'dateInput',
    });
  },
  onDateTableSelect(value) {
    this.onSelect(value);
  },
  onHeaderSelect(value) {
    // this.onSelect(value, {
    //   source: 'dateInput',
    // });
    this.setValue(value);
  },
  onToday() {
    const { value } = this.state;
    const now = getTodayTime(value);
    this.onSelect(now, {
      source: 'todayButton',
    });
  },
  getRootDOMNode() {
    return ReactDOM.findDOMNode(this);
  },
  openTimePicker() {
    this.setState({
      showTimePicker: true,
    });
  },
  closeTimePicker() {
    this.setState({
      showTimePicker: false,
    });
  },
  render() {
    const props = this.props;
    const {
      locale, prefixCls, disabledDate,
      dateInputPlaceholder, timePicker,
      disabledTime,
    } = props;
    const state = this.state;
    const { value, selectedValue, showTimePicker } = state;
    const disabledTimeConfig = showTimePicker && disabledTime && timePicker ?
      getTimeConfig(selectedValue, disabledTime) : null;

    const timePickerEle = timePicker && showTimePicker ? React.cloneElement(timePicker, {
      showHour: props.showHour,
      showSecond: props.showSecond,
      showMinute: true,
      locale,
      ...disabledTimeConfig,
      onChange: this.onDateInputChange,
      defaultOpenValue: value,
      value: selectedValue,
      disabledTime,
    }) : null;
    const dateInputElement = props.showDateInput ? (
      <DateInput
        ref="dateInput"
        format={this.getFormat()}
        key="date-input"
        value={value}
        locale={locale}
        placeholder={dateInputPlaceholder}
        showClear={false}
        disabledTime={disabledTime}
        disabledDate={disabledDate}
        onClear={this.onClear}
        prefixCls={prefixCls}
        selectedValue={selectedValue}
        onChange={this.onDateInputChange}
      />
    ) : null;
    const children = [
      props.renderSidebar(),
      (<div className={`${prefixCls}-panel`} key="panel">
        {dateInputElement}
        <div className={`fn-clear ${prefixCls}-date-main`}>
          <div className={`${prefixCls}-date-panel`}>
            <CalendarHeader
              locale={locale}
              onValueChange={this.onHeaderSelect}
              value={value}
              showTimePicker={showTimePicker}
              prefixCls={prefixCls}
            />
            <div className={`${prefixCls}-body`}>
              <DateTable
                locale={locale}
                value={value}
                selectedValue={selectedValue}
                prefixCls={prefixCls}
                dateRender={props.dateRender}
                contentRender={props.contentRender}
                onSelect={this.onDateTableSelect}
                disabledDate={disabledDate}
                showWeekNumber={props.showWeekNumber}
              />
            </div>
          </div>
          {timePicker && showTimePicker ?
            (<div className={`${prefixCls}-time-picker`}>
              <div className={`${prefixCls}-time-picker-panel`}>
                {timePickerEle}
              </div>
            </div>)
            : null}
        </div>
        {timePicker && showTimePicker ?
            (<CalendarFooter
              locale={locale}
              prefixCls={prefixCls}
              onOk={this.onOk}
            />)
            : null}
      </div>),
    ];


    return this.renderRoot({
      children,
      className: props.showWeekNumber ? `${prefixCls}-week-number` : '',
    });
  },
});

export default Calendar;
