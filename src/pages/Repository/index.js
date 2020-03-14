import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import Container from '../../components/Container';
import { Loading, Owner, IssueList, IssueFilter, PageActions } from './styles';

class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filters: [
      { value: 'all', label: 'Todas' },
      { value: 'open', label: 'Abertas' },
      { value: 'closed', label: 'Fechadas' },
    ],
    indexFilter: 0,
    page: 1,
  };

  async componentDidMount() {
    const { filters, indexFilter } = this.state;
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);
    const state = filters[indexFilter].value;

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  loadIssues = async () => {
    const { match } = this.props;
    const { filters, indexFilter, page } = this.state;
    const state = filters[indexFilter].value;

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state,
        per_page: 5,
        page,
      },
    });

    this.setState({ issues: response.data });
  };

  handleFilterClick = async indexFilter => {
    await this.setState({ indexFilter });
    this.loadIssues();
  };

  handlePage = async action => {
    const { page } = this.state;
    const gotoPage = action === 'back' ? page - 1 : page + 1;
    await this.setState({ page: gotoPage });

    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      filters,
      indexFilter,
      page,
    } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <IssueFilter active={indexFilter}>
            {filters.map((filter, index) => (
              <button
                type="button"
                key={filter.value}
                onClick={() => this.handleFilterClick(index)}
              >
                {filter.label}
              </button>
            ))}
          </IssueFilter>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <PageActions>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => this.handlePage('back')}
          >
            Anterior
          </button>
          <button type="button" onClick={() => this.handlePage('next')}>
            Proximo
          </button>
        </PageActions>
      </Container>
    );
  }
}

export default Repository;
