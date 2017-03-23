import React, {PropTypes, Component} from 'react'
import {formatInfiniteDuration} from 'utils/formatting'
import YesNoButtons from 'src/shared/components/YesNoButtons'
import onClickOutside from 'react-onclickoutside'

class DatabaseRow extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isEditing: false,
      isDeleting: false,
    }
    this.handleKeyDown = ::this.handleKeyDown
    this.handleClickOutside = ::this.handleClickOutside
    this.handleStartEdit = ::this.handleStartEdit
    this.handleEndEdit = ::this.handleEndEdit
    this.handleCreate = ::this.handleCreate
    this.handleUpdate = ::this.handleUpdate
    this.getInputValues = ::this.getInputValues
    this.handleStartDelete = ::this.handleStartDelete
    this.handleEndDelete = ::this.handleEndDelete
  }

  componentWillMount() {
    if (this.props.retentionPolicy.isNew) {
      this.setState({isEditing: true})
    }
  }

  render() {
    const {
      onRemove,
      retentionPolicy: {name, duration, replication, isDefault, isNew},
      retentionPolicy,
      database,
      onDelete,
      isRFDisplayed,
    } = this.props
    const {isEditing, isDeleting} = this.state

    const formattedDuration = formatInfiniteDuration(duration)

    if (isEditing) {
      return (
        <tr>
          <td>
            <div className="admin-table--edit-cell">
              <input
                className="form-control"
                name="name"
                type="text"
                defaultValue={name}
                placeholder="give it a name"
                onKeyDown={(e) => this.handleKeyDown(e, database)}
                autoFocus={true}
                ref={(r) => this.name = r}
              />
            </div>
          </td>
          <td>
            <div className="admin-table--edit-cell">
              <input
                className="form-control"
                name="name"
                type="text"
                defaultValue={formattedDuration}
                placeholder="how long should data last"
                onKeyDown={(e) => this.handleKeyDown(e, database)}
                ref={(r) => this.duration = r}
              />
            </div>
          </td>
          <td style={isRFDisplayed ? {} : {display: 'none'}}>
            <div className="admin-table--edit-cell">
              <input
                className="form-control"
                name="name"
                type="number"
                min="1"
                defaultValue={replication || 1}
                placeholder="how many nodes do you have"
                onKeyDown={(e) => this.handleKeyDown(e, database)}
                ref={(r) => this.replication = r}
              />
            </div>
          </td>
          <td className="text-right">
            <YesNoButtons
              onConfirm={isNew ? this.handleCreate : this.handleUpdate}
              onCancel={isNew ? () => onRemove(database, retentionPolicy) : this.handleEndEdit}
            />
          </td>
        </tr>
      )
    }

    return (
      <tr>
        <td onClick={this.handleStartEdit}> {name} {isDefault ? <span className="default-source-label">default</span> : null}</td>
        <td onClick={this.handleStartEdit}>{formattedDuration}</td>
        {isRFDisplayed ? <td onClick={this.handleStartEdit}>{replication}</td> : null}
        <td className="text-right">
          {
            isDeleting ?
              <YesNoButtons onConfirm={() => onDelete(database, retentionPolicy)} onCancel={this.handleEndDelete} /> :
              <button className="btn btn-xs btn-danger admin-table--delete" onClick={this.handleStartDelete}>
                {`Delete ${name}`}
              </button>
          }
        </td>
      </tr>
    )
  }

  handleClickOutside() {
    this.handleEndEdit()
    this.handleEndDelete()
  }

  handleStartEdit() {
    this.setState({isEditing: true})
  }

  handleEndEdit() {
    this.setState({isEditing: false})
  }

  handleStartDelete() {
    this.setState({isDeleting: true})
  }

  handleEndDelete() {
    this.setState({isDeleting: false})
  }

  handleCreate() {
    const {database, retentionPolicy, onCreate} = this.props
    const validInputs = this.getInputValues()
    if (!validInputs) {
      return
    }

    onCreate(database, {...retentionPolicy, ...validInputs})
    this.handleEndEdit()
  }

  handleUpdate() {
    const {database, retentionPolicy, onUpdate} = this.props
    const validInputs = this.getInputValues()
    if (!validInputs) {
      return
    }

    onUpdate(database, retentionPolicy, validInputs)
    this.handleEndEdit()
  }

  handleKeyDown(e) {
    const {key} = e
    const {retentionPolicy, database, onRemove} = this.props


    if (key === 'Escape') {
      if (retentionPolicy.isNew) {
        onRemove(database, retentionPolicy)
        return
      }

      this.handleEndEdit()
    }

    if (key === 'Enter') {
      if (retentionPolicy.isNew) {
        this.handleCreate()
        return
      }

      this.handleUpdate()
    }
  }

  getInputValues() {
    const name = this.name.value.trim()
    let duration = this.duration.value.trim()
    const replication = +this.replication.value.trim()
    const {notify} = this.props

    if (!name || !duration || !replication) {
      notify('error', 'Fields cannot be empty')
      return
    }

    if (duration === '∞') {
      duration = 'INF'
    }

    return {
      name,
      duration,
      replication,
    }
  }

}

const {
  bool,
  func,
  number,
  shape,
  string,
} = PropTypes

DatabaseRow.propTypes = {
  retentionPolicy: shape({
    name: string,
    duration: string,
    replication: number,
    isDefault: bool,
    isEditing: bool,
  }),
  database: shape(),
  onRemove: func,
  onCreate: func,
  onUpdate: func,
  onDelete: func,
  notify: func,
  isRFDisplayed: bool,
}

export default onClickOutside(DatabaseRow)
