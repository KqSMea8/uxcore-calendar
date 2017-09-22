const Datepicker = require('rc-calendar/lib/Picker');
const RcMonthCalendar = require('rc-calendar/lib/MonthCalendar');
const React = require('react');
const moment = require('moment');
const Icon = require('uxcore-icon');
const classnames = require('classnames');
const util = require('./util');

const CalendarLocale = {};
const { getCalendarContainer, generalizeFormat } = util;

CalendarLocale['zh-cn'] = require('rc-calendar/lib/locale/zh_CN');
CalendarLocale['en-us'] = require('rc-calendar/lib/locale/en_US');

class MonthCalendar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    this.clearValue = this.clearValue.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  getTriggerNode() {
    return this.trigger;
  }

  getDate(date) {
    const me = this;
    const { timezone, locale } = me.props;
    const value = moment(date).locale(locale);
    if (timezone) {
      return value.utcOffset(parseInt(timezone, 10) * 60);
    }
    return value;
  }

  clearValue(e) {
    e.stopPropagation();
    this.props.onSelect(null, null);
  }

  saveRef(refName) {
    const me = this;
    return (c) => {
      me[refName] = c;
    };
  }

  handleChange(v) {
    const p = this.props;
    if (v) {
      const date = v.valueOf();
      this.props.onSelect(new Date(date), v.format(p.format));
    } else {
      this.props.onSelect(v, v);
    }
  }

  render() {
    const me = this;
    const p = me.props;
    const calendarOptions = {
      className: classnames(p.className, {
        [`kuma-calendar-${p.size}`]: !!p.size,
      }),
      style: p.style,
      locale: CalendarLocale[p.locale],
      orient: ['top', 'left'],
      showDateInput: p.showDateInput,
      prefixCls: 'kuma-calendar',
    };
    const pickerOptions = {
      disabled: p.disabled,
      align: p.align,
      transitionName: p.transitionName,
      adjustOrientOnCalendarOverflow: false,
      prefixCls: 'kuma-calendar-picker',
      getCalendarContainer: p.getPopupContainer || getCalendarContainer,
    };

    if (p.value) {
      const value = this.getDate(p.value);
      pickerOptions.value = calendarOptions.defaultValue = value;
    } else {
      pickerOptions.value = calendarOptions.defaultValue = null;
    }

    if (p.defaultValue) {
      const value = this.getDate(p.defaultValue);
      calendarOptions.defaultValue = value;
      pickerOptions.defaultValue = value;
    } else {
      const value = this.getDate(new Date().getTime());
      calendarOptions.defaultValue = value;
    }

    const calendar = <RcMonthCalendar {...calendarOptions} />;

    const triggerStyle = {};
    if (p.inputWidth) {
      triggerStyle.width = p.inputWidth;
    }

    const inputClassName = classnames('kuma-input', {
      [`kuma-input-${p.size}-size`]: !!p.size,
    });

    const triggerClassName = classnames('kuma-calendar-picker-input', {
      [`kuma-calendar-picker-input-${p.size}`]: !!p.size,
    });

    return (
      <Datepicker
        calendar={calendar}
        onChange={me.handleChange}
        {...pickerOptions}
      >
        {({ value }) => {
          const showClear = value && !p.disabled;
          return (
            <span className={triggerClassName} style={triggerStyle} ref={me.saveRef('trigger')}>
              <input
                value={value && value.format(generalizeFormat(p.format))}
                readOnly
                disabled={me.props.disabled}
                placeholder={this.props.placeholder}
                className={inputClassName}
              />
              {p.hasTrigger ? <Icon name="riqi" className={`kuma-calendar-trigger-icon ${showClear ? 'kuma-calendar-trigger-icon__has-clear' : ''}`} /> : null}
              {showClear
                ? <i
                  className="uxcore-icon uxicon-biaodanlei-tongyongqingchu kuma-icon-close"
                  onClick={this.clearValue}
                />
                : null}
            </span>
          );
        }}
      </Datepicker>
    );
  }
}

MonthCalendar.displayName = 'MonthCalendar';
MonthCalendar.defaultProps = {
  format: 'YYYY-MM',
  placeholder: '请选择月份',
  onSelect() { },
  locale: 'zh-cn',
  transitionName: 'calendarSlideUp',
  align: {
    offset: [0, 0],
  },
  showDateInput: false,
  hasTrigger: true,
};
MonthCalendar.propTypes = {
  format: React.PropTypes.string,
  inputWidth: React.PropTypes.number,
  placeholder: React.PropTypes.string,
  onSelect: React.PropTypes.func,
  locale: React.PropTypes.string,
  getPopupContainer: React.PropTypes.func,
};


module.exports = MonthCalendar;
